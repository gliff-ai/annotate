/* eslint-disable no-param-reassign */
import * as UTIF from "utif";
import { ImageFileInfo } from "@gliff-ai/upload";
import { Annotation, XYPoint } from "@/annotation/interfaces";
import { palette } from "@/palette";

function drawCapsule(
  point0: XYPoint,
  point1: XYPoint,
  r: number,
  dataSlice: Uint8Array,
  imageWidth: number,
  annotationIndex: number,
  brushType: "paint" | "erase",
  samplesPerPixel = 3
): Uint8Array {
  // Draw a capsule between points0 (x0, y0) and point1 (x1,y1) of radius r.
  // Procedure:
  // We draw the capsule from top to bottom.
  // For each scanline, we determine the left and right x coordinates and draw the line.
  // This means that we must identify the left and right edges of the line.
  // Each edge can be divided into three part: the top cap, the straight line, the bottom cap.
  const arr = dataSlice;
  const annotationColor = palette[annotationIndex];

  const roundXYPoint = (point: XYPoint): XYPoint => ({
    x: Math.round(point.x),
    y: Math.round(point.y),
  });

  const { x: x0, y: y0 } = roundXYPoint(point0);
  const { x: x1, y: y1 } = roundXYPoint(point1);

  // Sort the points so that A=(ax,ay) is at the top and B=(bx,by) at the bottom.
  const [ax, bx] = y0 < y1 ? [x0, x1] : [x1, x0];
  const [ay, by] = y0 < y1 ? [y0, y1] : [y1, y0];

  // Calculate the vector AB.
  const abx = bx - ax;
  const aby = by - ay;

  // Calculate the squared norm of AB.
  const sqab = abx * abx + aby * aby;

  // Calculate the norm of AB.
  const ab = Math.sqrt(sqab);

  // Compute a vector of norm r perpendicular to AB.
  const nrx = (r * aby) / ab;
  const nry = (-r * abx) / ab;

  // Note that if ab is null (i.e. horizontal capsule),
  // nrx and nry will be ill defined (NaN) however this is not a problem
  // because "second case" in the loop below will not be used.

  // We use this vector to find the extremities of the straight lines;
  // that is where they meet the end caps.
  // left means on the left side, right on the left side
  // 1 means top of the line and 2 bottom.
  // Note that we don't need to calculate left2_x and right2_x.
  const left1x = ax - nrx;
  const left1y = ay - nry;
  const left2y = by - nry;

  const right1x = ax + nrx;
  const right1y = ay + nry;
  const right2y = by + nry;

  // We remember the previous [xmin, xmax] range.
  let lastXmin = -Infinity;
  let lastXmax = Infinity;

  // Loop through the scanlines. The vertical range is the rounded [ay-r,by+r].
  for (let y = Math.round(ay - r); y < Math.round(by + r); y += 1) {
    let xmin;
    let xmax;

    // Determine xmin on the left.
    if (y < left1y) {
      // First case: drawing the left contour of the top end cap.
      // Use Pythagore' theorem
      const apy = y - ay;
      const dx = Math.sqrt(r * r - apy * apy);
      xmin = ax - dx;
    } else if (y < left2y) {
      // Second case: drawing the left straight edge.
      xmin = (abx / aby) * (y - left1y) + left1x;
    } else {
      // Third case: drawing the left contour of the bottom end cap.
      // Use Pythagore' theorem
      const bpy = y - by;
      const dx = Math.sqrt(r * r - bpy * bpy);
      xmin = bx - dx;
    }

    // Determine xmax on the right.
    if (y < right1y) {
      // First case: drawing the right contour of the top end cap.
      // Use Pythagore' theorem
      const apy = y - ay;
      const dx = Math.sqrt(r * r - apy * apy);
      xmax = ax + dx;
    } else if (y < right2y) {
      // Second case: drawing the right straight edge.
      xmax = (abx / aby) * (y - right1y) + right1x;
    } else {
      // Third case: drawing the right contour of the bottom end cap.
      // Use Pythagore' theorem
      const bpy = y - by;
      const dx = Math.sqrt(r * r - bpy * bpy);
      xmax = bx + dx;
    }

    // Round the range
    xmin = Math.round(xmin);
    xmax = Math.round(xmax);

    // Ensure that the [xmin,xmax] range the new scanlines overlaps
    // at least by one pixel with the range of the previous scanline.
    // This ensures that when the radius is 1/2, lines with pixels connected by their edge.
    xmin = Math.min(lastXmax - 1, xmin);
    xmax = Math.max(lastXmin + 1, xmax);

    lastXmin = xmin;
    lastXmax = xmax;

    // Draw the scanline between [xmin,xmax].

    if (brushType === "paint") {
      for (let x = xmin; x < xmax; x += 1) {
        // If point is on the image
        if (x >= 0 && x <= imageWidth) {
          const index = samplesPerPixel * (imageWidth * y + x);
          annotationColor.forEach((c, i) => {
            arr[index + i] = c;
          });
        }
      }
    } else {
      for (let x = xmin; x < xmax; x += 1) {
        // If point is on the image
        if (x >= 0 && x <= imageWidth) {
          const index = samplesPerPixel * (imageWidth * y + x);
          if (
            arr.slice(index, index + 3).toString() ===
            annotationColor.toString()
          ) {
            annotationColor.forEach((c, i) => {
              arr[index + i] = 0;
            });
          }
        }
      }
    }
  }
  return arr;
}

function getImageData(data: Uint8Array[], ifds: UTIF.IFD[]): Uint8Array {
  const ifdsLength = UTIF.encode(ifds).byteLength;
  let offset = ifdsLength;

  data.forEach((dataSlice, i) => {
    ifds[i].t273 = [offset];
    offset += dataSlice.byteLength;
  });

  const headers = new Uint8Array(UTIF.encode(ifds));
  const imageData = new Uint8Array(offset);

  for (let i = 0; i < headers.byteLength; i += 1) {
    imageData[i] = headers[i];
  }

  offset = ifdsLength;
  data.forEach((dataSlice) => {
    for (let j = 0; j < dataSlice.byteLength; j += 1) {
      imageData[offset + j] = dataSlice[j];
    }
    offset += dataSlice.byteLength;
  });

  return imageData;
}

function exportImageDataAsTiff(imageData: Uint8Array, fileName: string): void {
  const anchor = document.createElement("a");
  const blob = new Blob([imageData], { type: "image/tiff" });
  const url = window.URL.createObjectURL(blob);
  anchor.href = url;

  const name = fileName.split(".").shift();
  anchor.download = `${name}_annotations.tiff`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function downloadPaintbrushAsTiff(
  annotations: Annotation[],
  imageFileInfo: ImageFileInfo
): void {
  // const uint16ColorMap = getColorMap(uint8ColorMap);
  const samplesPerPixel = 3;
  const { width, height, num_slices: slices, fileName } = imageFileInfo;

  const ifds = [...new Array<UTIF.IFD>(slices)].map(
    () =>
      ({
        t256: [width], // ImageWidth
        t257: [height], // ImageLength
        t258: [8], // BitsPerSample
        t259: [1], // Compression: No compression
        t262: [2], // PhotometricInterpretation (1 for Grayscale; 2 for Full color)
        t273: [0], // StripOffsets, placeholder
        t277: [samplesPerPixel], // SamplesPerPixel (1 for Grayscale, 3+ for Full color)
        t278: [height], // RowsPerStrip
        t279: [width * height * samplesPerPixel], // StripByteCounts
        t282: [1], // XResolution
        t283: [1], // YResolution
        t286: [0], // XPosition
        t287: [0], // YPosition
        t296: [1], // ResolutionUnit: No absolute unit
        t305: ["gliff.ai"], // Software
      } as unknown as UTIF.IFD)
  );
  const slicesData = [...new Array<Uint8Array>(slices)].map(
    () => new Uint8Array(width * height * samplesPerPixel)
  );

  annotations.forEach(({ toolbox, brushStrokes }, annotationIndex) => {
    if (toolbox === "paintbrush") {
      brushStrokes.forEach(({ coordinates, brush, spaceTimeInfo }) => {
        coordinates.forEach((point0, i) => {
          slicesData[spaceTimeInfo.z] = drawCapsule(
            point0,
            i + 1 < coordinates.length ? coordinates[i + 1] : point0,
            brush.radius,
            slicesData[spaceTimeInfo.z],
            width,
            annotationIndex,
            brush.type
          );
        });
      });
    }
  });

  // Prepare data for export, combining slicesData wi ifds
  const imageData = getImageData(slicesData, ifds);

  // export image data as tiff file
  exportImageDataAsTiff(imageData, fileName);
}
