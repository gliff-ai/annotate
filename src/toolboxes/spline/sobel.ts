// This is a much modified version of https://github.com/miguelmota/sobel
// by Miguel Mota, which is made available under the MIT license.

export function calculateSobel(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;

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
  let sobelData = new Uint8ClampedArray(width * height * 4);

  function bindPixelAt(data: Uint8ClampedArray) {
    return function (x: number, y: number, channel?: number): number {
      channel = channel || 0;
      return data[(width * y + x) * 4 + channel];
    };
  }

  function bindSetPixelAt(data: Uint8ClampedArray) {
    return function (
      x: number,
      y: number,
      r = 0,
      g = 0,
      b = 0,
      alpha = 0
    ): void {
      data[(width * y + x) * 4 + 0] = r;
      data[(width * y + x) * 4 + 1] = g;
      data[(width * y + x) * 4 + 2] = b;
      data[(width * y + x) * 4 + 3] = alpha;
    };
  }

  const data = imageData.data;
  const pixelAt = bindPixelAt(data);
  const setGreyscalePixelAt = bindSetPixelAt(greyscaleData);
  let x, y, i, j;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
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

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      let sobelX = 0;
      for (i = -1; i <= 1; i++) {
        for (j = -1; j <= 1; j++) {
          sobelX =
            sobelX + kernelX[i + 1][j + 1] * greyscalePixelAt(x + i, y + j);
        }
      }
      let sobelY = 0;
      for (i = -1; i <= 1; i++) {
        for (j = -1; j <= 1; j++) {
          sobelY =
            sobelY + kernelY[i + 1][j + 1] * greyscalePixelAt(x + i, y + j);
        }
      }

      let magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
      if (isNaN(magnitude)) {
        magnitude = 0;
      } else {
        magnitudeMax = Math.max(magnitudeMax, magnitude);
      }
      setSobelPixelAt(x, y, magnitude, magnitude, magnitude, 255);
    }
  }

  return new ImageData(sobelData, width, height);
}
