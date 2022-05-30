// code modified from https://github.com/piximi/piximi/blob/master/src/image/slic.ts
// available under a BSD-like license: https://github.com/piximi/piximi/blob/master/LICENSE

import { getDataFromImageBitmap } from "@/toolboxes/helpers";

export const slic = (
  image: ImageBitmap,
  regionSize = 40
): { count: number; map: Uint8ClampedArray; superpixels: Int32Array } => {
  const minRegionSize = (regionSize * regionSize) / 4;
  const imWidth = image.width;
  const imHeight = image.height;
  const numRegionsX = parseInt(String(imWidth / regionSize), 10);
  const numRegionsY = parseInt(String(imHeight / regionSize), 10);
  const numRegions = parseInt(String(numRegionsX * numRegionsY), 10);
  const numPixels = parseInt(String(imWidth * imHeight), 10);
  const masses = new Array(numPixels);
  const currentCenters = new Float32Array((2 + 3) * numRegions);
  const newCenters = new Float32Array((2 + 3) * numRegions);
  const parameters = new Float32Array(2 * numRegions);
  const mcMap = new Float32Array(numPixels);
  const msMap = new Float32Array(numPixels);
  const distanceMap = new Float32Array(numPixels);
  const data = getDataFromImageBitmap(image);

  // convert RGB to XYZ
  const xyz = new Float32Array(3 * imWidth * imHeight);
  const gamma = 2.2;
  for (let i = 0; i < imWidth * imHeight; i += 1) {
    const r = (parseFloat(String(data[4 * i])) * 0.00392156862) ** gamma;
    const g = (parseFloat(String(data[4 * i + 1])) * 0.00392156862) ** gamma;
    const b = parseFloat(String(data[4 * i + 2])) * 0.00392156862 ** gamma;

    xyz[i] = r * 0.488718 + g * 0.31068 + b * 0.200602;
    xyz[i + imWidth * imHeight] = r * 0.176204 + g * 0.812985 + b * 0.0108109;
    xyz[i + 2 * imWidth * imHeight] = g * 0.0102048 + b * 0.989795;
  }

  // convert XYZ to Lab
  const xw = 1.0 / 3.0;
  const yw = 1.0 / 3.0;
  const Yw = 1.0;
  const Xw = xw / yw;
  const Zw = ((1 - xw - yw) / yw) * Yw;
  const ix = 1.0 / Xw;
  const iy = 1.0 / Yw;
  const iz = 1.0 / Zw;
  const lab = new Float32Array(3 * imWidth * imHeight);

  for (let i = 0; i < imWidth * imHeight; i += 1) {
    const fx =
      xyz[i] * ix > 0.00856
        ? (xyz[i] * ix) ** 0.33333333
        : 7.78706891568 * xyz[i] * ix + 0.1379310336;

    const fy =
      xyz[imWidth * imHeight + i] * iy > 0.00856
        ? (xyz[imWidth * imHeight + i] * iy) ** 0.33333333
        : 7.78706891568 * xyz[imWidth * imHeight + i] * iy + 0.1379310336;

    const fz =
      xyz[2 * imWidth * imHeight + i] * iz > 0.00856
        ? (xyz[2 * imWidth * imHeight + i] * iz) ** 0.33333333
        : 7.78706891568 * xyz[2 * imWidth * imHeight + i] * iz + 0.1379310336;

    lab[i] = 116.0 * fy - 16.0;
    lab[i + imWidth * imHeight] = 500.0 * (fx - fy);
    lab[i + 2 * imWidth * imHeight] = 200.0 * (fy - fz);
  }

  // compute gradient
  const gradient = new Float32Array(numPixels);

  for (let k = 0; k < 3; k += 1) {
    for (let y = 1; y < imHeight - 1; y += 1) {
      for (let x = 1; x < imWidth - 1; x += 1) {
        const a = lab[k * imWidth * imHeight + y * imWidth + x - 1];
        const b = lab[k * imWidth * imHeight + y * imWidth + x + 1];
        const c = lab[k * imWidth * imHeight + (y + 1) * imWidth + x];
        const d = lab[k * imWidth * imHeight + (y - 1) * imWidth + x];

        gradient[y * imWidth + x] =
          gradient[y * imWidth + x] + (a - b) * (a - b) + (c - d) * (c - d);
      }
    }
  }

  // initialize k-means centroids
  // TODO are these currently "square" centroids even if the image is rectangular?
  let i = 0;
  let j = 0;

  for (let v = 0; v < numRegionsY; v += 1) {
    for (let u = 0; u < numRegionsX; u += 1) {
      let centerx = 0;
      let centery = 0;
      let minEdgeValue = Infinity;

      let x = parseInt(String(Math.round(regionSize * (u + 0.5))), 10);
      let y = parseInt(String(Math.round(regionSize * (v + 0.5))), 10);

      x = Math.max(Math.min(x, imWidth - 1), 0);
      y = Math.max(Math.min(y, imHeight - 1), 0);

      for (
        let yp = Math.max(0, y - 1);
        yp <= Math.min(imHeight - 1, y + 1);
        yp += 1
      ) {
        for (
          let xp = Math.max(0, x - 1);
          xp <= Math.min(imWidth - 1, x + 1);
          xp += 1
        ) {
          const thisEdgeValue = gradient[yp * imWidth + xp];

          if (thisEdgeValue < minEdgeValue) {
            minEdgeValue = thisEdgeValue;
            centerx = xp;
            centery = yp;
          }
        }
      }

      currentCenters[i] = parseFloat(String(centerx));
      i += 1;
      currentCenters[i] = parseFloat(String(centery));
      i += 1;

      currentCenters[i] = lab[centery * imWidth + centerx];
      i += 1;
      currentCenters[i] = lab[imWidth * imHeight + centery * imWidth + centerx];
      i += 1;
      currentCenters[i] =
        lab[2 * imWidth * imHeight + centery * imWidth + centerx];
      i += 1;

      parameters[j] = 10 * 10;
      j += 1;
      parameters[j] = regionSize * regionSize;
      j += 1;
    }
  }

  const iterations = 10;

  const segmentation = new Int32Array(numPixels);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    // Label
    for (let i1 = 0; i1 < distanceMap.length; i1 += 1) {
      distanceMap[i1] = Infinity;
    }

    for (let region = 0; region < numRegionsX * numRegionsY; region += 1) {
      const cx = Math.round(currentCenters[region * 5]);
      const cy = Math.round(currentCenters[region * 5 + 1]);

      for (
        let y2 = Math.max(0, cy - regionSize);
        y2 < Math.min(imHeight, cy + regionSize);
        y2 += 1
      ) {
        for (
          let x2 = Math.max(0, cx - regionSize);
          x2 < Math.min(imWidth, cx + regionSize);
          x2 += 1
        ) {
          const spatial = (x2 - cx) * (x2 - cx) + (y2 - cy) * (y2 - cy);
          const dR = lab[y2 * imWidth + x2] - currentCenters[5 * region + 2];
          const dG =
            lab[imWidth * imHeight + y2 * imWidth + x2] -
            currentCenters[5 * region + 3];
          const dB =
            lab[2 * imWidth * imHeight + y2 * imWidth + x2] -
            currentCenters[5 * region + 4];
          const appearance = dR * dR + dG * dG + dB * dB;

          const distance = Math.sqrt(
            appearance / parameters[region * 2] +
              spatial / parameters[region * 2 + 1]
          );

          if (distance < distanceMap[y2 * imWidth + x2]) {
            distanceMap[y2 * imWidth + x2] = distance;
            segmentation[y2 * imWidth + x2] = region;
          }
        }
      }
    }

    for (let y2 = 0; y2 < imHeight; y2 += 1) {
      for (let x2 = 0; x2 < imWidth; x2 += 1) {
        if (
          parameters[segmentation[y2 * imWidth + x2] * 2] <
          mcMap[y2 * imWidth + x2]
        ) {
          parameters[segmentation[y2 * imWidth + x2] * 2] =
            mcMap[y2 * imWidth + x2];
        }

        if (
          parameters[segmentation[y2 * imWidth + x2] * 2 + 1] <
          msMap[y2 * imWidth + x2]
        ) {
          parameters[segmentation[y2 * imWidth + x2] * 2 + 1] =
            msMap[y2 * imWidth + x2];
        }
      }
    }

    // update parameters
    const mc = new Float32Array(parameters.length / 2);
    const ms = new Float32Array(parameters.length / 2);

    for (let i1 = 0; i1 < segmentation.length; i1 += 1) {
      const region = segmentation[i1];

      if (mc[region] < mcMap[region]) {
        mc[region] = mcMap[region];

        parameters[region * 2] = mcMap[region];
      }

      if (ms[region] < msMap[region]) {
        ms[region] = msMap[region];

        parameters[region * 2 + 1] = msMap[region];
      }
    }

    // reset masses to zero
    for (let i2 = 0; i2 < masses.length; i2 += 1) {
      masses[i2] = 0;
    }
    // reset newCenters to zero
    for (let i2 = 0; i2 < newCenters.length; i2 += 1) {
      newCenters[i2] = 0;
    }

    // compute centroids
    let region;

    for (let y1 = 0; y1 < imHeight; y1 += 1) {
      for (let x1 = 0; x1 < imWidth; x1 += 1) {
        region = segmentation[x1 + y1 * imWidth];

        masses[region] += 1;

        newCenters[region * 5] += x1;
        newCenters[region * 5 + 1] += y1;
        newCenters[region * 5 + 2] += lab[y1 * imWidth + x1];
        newCenters[region * 5 + 3] +=
          lab[imWidth * imHeight + y1 * imWidth + x1];
        newCenters[region * 5 + 4] +=
          lab[2 * imWidth * imHeight + y1 * imWidth + x1];
      }
    }

    for (region = 0; region < numRegions; region += 1) {
      const iMass = 1.0 / Math.max(masses[region], 1e-8);

      newCenters[region * 5] = newCenters[region * 5] * iMass;
      newCenters[region * 5 + 1] = newCenters[region * 5 + 1] * iMass;
      newCenters[region * 5 + 2] = newCenters[region * 5 + 2] * iMass;
      newCenters[region * 5 + 3] = newCenters[region * 5 + 3] * iMass;
      newCenters[region * 5 + 4] = newCenters[region * 5 + 4] * iMass;
    }

    // compute residual error
    let error = 0.0;

    for (let index = 0; index < currentCenters.length; index += 1) {
      const d = currentCenters[index] - newCenters[index];

      error += Math.sqrt(d * d);
    }

    if (error < 1e-5) {
      break;
    }

    // update centers
    for (let i2 = 0; i2 < currentCenters.length; i2 += 1) {
      currentCenters[i2] = newCenters[i2];
    }
  }

  // remove small objects
  const cleaned = new Int32Array(numPixels);
  const segment = new Int32Array(numPixels);

  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];

  let segmentSize;
  let label;
  let cleanedLabel;
  let numExpanded;
  let x1;
  let y1;
  let xp;
  let yp;
  let neighbor;

  for (let pixel = 0; pixel < numPixels; pixel += 1) {
    if (!cleaned[pixel]) {
      label = segmentation[pixel];
      numExpanded = 0;
      segmentSize = 0;
      segment[segmentSize] = pixel;
      segmentSize += 1;

      cleanedLabel = label + 1;
      cleaned[pixel] = label + 1;
      x1 = pixel % imWidth;
      y1 = Math.floor(pixel / imWidth);

      for (let direction = 0; direction < 4; direction += 1) {
        xp = x1 + dx[direction];
        yp = y1 + dy[direction];
        neighbor = xp + yp * imWidth;

        if (
          xp >= 0 &&
          xp < imWidth &&
          yp >= 0 &&
          yp < imHeight &&
          cleaned[neighbor]
        ) {
          cleanedLabel = cleaned[neighbor];
        }
      }

      while (numExpanded < segmentSize) {
        const open = segment[numExpanded];
        numExpanded += 1;

        x1 = open % imWidth;
        y1 = Math.floor(open / imWidth);

        for (let direction = 0; direction < 4; direction += 1) {
          xp = x1 + dx[direction];
          yp = y1 + dy[direction];
          neighbor = xp + yp * imWidth;

          if (
            xp >= 0 &&
            xp < imWidth &&
            yp >= 0 &&
            yp < imHeight &&
            cleaned[neighbor] === 0 &&
            segmentation[neighbor] === label
          ) {
            cleaned[neighbor] = label + 1;
            segment[segmentSize] = neighbor;
            segmentSize += 1;
          }
        }
      }

      if (segmentSize < minRegionSize) {
        while (segmentSize > 0) {
          // eslint-disable no-plusplus
          // FIXME for some reason I can't replace this line:
          cleaned[segment[--segmentSize]] = cleanedLabel;
          // with these two lines:
          // cleaned[segment[segmentSize]] = cleanedLabel;
          // segmentSize -= 1;
          // as it doesn't clean the small areas properly?
          // eslint-enable no-plusplus
        }
      }
    }
  }

  for (let pixel = 0; pixel < numPixels; pixel += 1) {
    cleaned[pixel] -= 1;
  }

  for (let index = 0; index < numPixels; index += 1) {
    segmentation[index] = cleaned[index];
  }

  return {
    count: 0,
    map: data,
    superpixels: segmentation,
  };
};
