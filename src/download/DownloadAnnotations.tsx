import * as UTIF from "utif";
import { Annotation, XYPoint } from "@/annotation/interfaces";

export function downloadPaintbrushAsTiff(
  annotations: Annotation[],
  fileName: string,
  width: number,
  height: number,
  slices: number,
  xResolution: number,
  yResolution: number
) {
  const ifds = [...new Array<UTIF.IFD>(slices)].map(
    () =>
      (({
        t256: [width], // ImageWidth
        t257: [height], // ImageLength
        t258: [8], // BitsPerSample
        t259: [1], // Compression: No compression
        t262: [1], // PhotometricInterpretation: Grayscale
        t273: [0], // StripOffsets, placeholder
        t277: [1], // SamplesPerPixel
        t278: [height], // RowsPerStrip
        t279: [width * height], // StripByteCounts
        t282: [xResolution], // XResolution
        t283: [yResolution], // YResolution
        t286: [0], // XPosition
        t287: [0], // YPosition
        t296: [1], // ResolutionUnit: No absolute unit
        t305: ["gliff.ai"], // Software
      } as unknown) as UTIF.IFD)
  );
  const slicesData = [...new Array<Uint8Array>(slices)].map(
    () => new Uint8Array(width * height)
  );

  let inputValue: number;
  let prevZ: number;
  annotations.forEach(({ toolbox, brushStrokes }) => {
    prevZ = null;
    if (toolbox === "paintbrush") {
      brushStrokes.forEach(({ coordinates, brush, spaceTimeInfo }) => {
        if (prevZ !== spaceTimeInfo.z) {
          inputValue = getNextMin(slicesData[spaceTimeInfo.z]);
          prevZ = spaceTimeInfo.z;
        }

        coordinates.forEach((point0, i) => {
          drawCapsule(
            point0,
            i + 1 < coordinates.length ? coordinates[i + 1] : point0,
            brush.radius,
            slicesData[spaceTimeInfo.z],
            width,
            inputValue,
            brush.type
          );
        });
      });
    }
  });

  const ifdsLength = UTIF.encode(ifds).byteLength;
  let offset = ifdsLength;

  for (let i = 0; i < slices; i++) {
    ifds[i].t273 = [offset];
    offset += slicesData[i].byteLength;
  }

  const headers = new Uint8Array(UTIF.encode(ifds));
  const imageData = new Uint8Array(offset);

  for (let i = 0; i < headers.byteLength; i++) {
    imageData[i] = headers[i];
  }

  offset = ifdsLength;
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < slicesData[i].byteLength; j++) {
      imageData[offset + j] = slicesData[i][j];
    }
    offset += slicesData[i].byteLength;
  }

  downloadData(fileName, imageData);
}

function downloadData(fileName: string, data: Uint8Array): void {
  const [name, format] = fileName.split(".");

  const anchor = document.createElement("a");
  anchor.style.display = "none";
  const blob = new Blob([data], { type: "image/tiff" });
  const url = window.URL.createObjectURL(blob);
  anchor.href = url;

  anchor.download = `${name}_annotations.tif`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function getNextMin(arr: Uint8Array): number {
  let len = arr.length;
  let min = 256;

  while (len--) {
    min = arr[len] < min && arr[len] !== 0 ? arr[len] : min;
  }
  return min - 1;
}

function drawCapsule(
  point0: XYPoint,
  point1: XYPoint,
  r: number,
  arr: Uint8Array,
  width: number,
  inputValue: number,
  brushType: "paint" | "erase"
): void {
  // Draw a capsule between points (x0, y0) and (x1,y1) of radius r.
  // We draw the capsule from top to bottom.
  // For each scanline, we determine the left and right x coordinates and draw the line.
  // This means that we must identify the left and right edges of the line.
  // Each edge can be divided into three part: the top cap, the straight line, the bottom cap.

  let fillFunc;
  if (brushType === "paint") {
    fillFunc = (value: number, oldValue?: number): number => value;
  } else if (brushType === "erase") {
    fillFunc = (value: number, oldValue?: number): number =>
      oldValue === value ? 0 : oldValue;
  }

  const roundXYPoint = (point: XYPoint): XYPoint => ({
    x: Math.round(point.x),
    y: Math.round(point.y),
  });

  // Sort the points so that A=(ax,ay) is at the top and B=(bx,by) at the bottom.
  const { x: x0, y: y0 } = roundXYPoint(point0);
  const { x: x1, y: y1 } = roundXYPoint(point1);
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
  for (let y = Math.round(ay - r); y <= Math.round(by + r); y++) {
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
    xmin = Math.ceil(xmin);
    xmax = Math.ceil(xmax);

    // Ensure that the [xmin,xmax] range the new scanlines overlaps
    // at least by one pixel with the range of the previous scanline.
    // This ensures that when the radius is 1/2, lines with pixels connected by their edge.
    xmin = Math.min(lastXmax - 1, xmin);
    xmax = Math.max(lastXmin + 1, xmax);

    lastXmin = xmin;
    lastXmax = xmax;

    // Draw the scanline between [xmin,xmax].
    for (let x = xmin; x <= xmax; x++) {
      arr[width * y + x] = fillFunc(inputValue, arr[width * y + x]);
    }
  }
}
