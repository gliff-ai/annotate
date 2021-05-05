// This is a much modified version of https://github.com/miguelmota/sobel
// by Miguel Mota, which is made available under the MIT license.

function getDataFromImageBitmap(imageBitmap: ImageBitmap): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  ctx.drawImage(imageBitmap, 0, 0);

  return ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height).data;
}

export function calculateSobel(imageBitmap: ImageBitmap): ImageData {
  const { width } = imageBitmap;
  const { height } = imageBitmap;

  const kernelX = [
    [-0.125, 0, 0.125],
    [-0.25, 0, 0.25],
    [-0.125, 0, 0.125],
  ];

  const kernelY = [
    [-0.125, -0.25, -0.125],
    [0, 0, 0],
    [0.125, 0.25, 0.125],
  ];

  const greyscaleData = new Uint8ClampedArray(width * height * 4);
  const sobelData = new Uint8ClampedArray(width * height * 4);

  function bindPixelAt(data: Uint8ClampedArray) {
    return (x: number, y: number, channel?: number): number => {
      const actualChannel = channel || 0;
      return data[(width * y + x) * 4 + actualChannel];
    };
  }

  function bindSetPixelAt(data: Uint8ClampedArray) {
    return (x: number, y: number, r = 0, g = 0, b = 0, alpha = 0): void => {
      /* eslint-disable no-param-reassign */
      data[(width * y + x) * 4] = r;
      data[(width * y + x) * 4 + 1] = g;
      data[(width * y + x) * 4 + 2] = b;
      data[(width * y + x) * 4 + 3] = alpha;
      /* eslint-enable no-param-reassign */
    };
  }

  const data = getDataFromImageBitmap(imageBitmap);
  const pixelAt = bindPixelAt(data);
  const setGreyscalePixelAt = bindSetPixelAt(greyscaleData);
  let x;
  let y;
  let i;
  let j;

  for (y = 0; y < height; y += 1) {
    for (x = 0; x < width; x += 1) {
      const r = pixelAt(x, y, 0);
      const g = pixelAt(x, y, 1);
      const b = pixelAt(x, y, 2);

      const avg = (r + g + b) / 3;
      setGreyscalePixelAt(x, y, avg, avg, avg, 255);
    }
  }

  const greyscalePixelAt = bindPixelAt(greyscaleData);
  const setSobelPixelAt = bindSetPixelAt(sobelData);

  let magnitudeMax = 0;

  for (y = 0; y < height; y += 1) {
    for (x = 0; x < width; x += 1) {
      let sobelX = 0;
      for (i = -1; i <= 1; i += 1) {
        for (j = -1; j <= 1; j += 1) {
          sobelX += kernelX[i + 1][j + 1] * greyscalePixelAt(x + i, y + j);
        }
      }
      let sobelY = 0;
      for (i = -1; i <= 1; i += 1) {
        for (j = -1; j <= 1; j += 1) {
          sobelY += kernelY[i + 1][j + 1] * greyscalePixelAt(x + i, y + j);
        }
      }

      let magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
      if (Number.isNaN(magnitude)) {
        magnitude = 0;
      } else {
        magnitudeMax = Math.max(magnitudeMax, magnitude);
      }
      setSobelPixelAt(x, y, magnitude, magnitude, magnitude, 255);
    }
  }

  return new ImageData(sobelData, width, height);
}
