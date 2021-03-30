// This is a much modified version of https://github.com/miguelmota/sobel
// by Miguel Mota, which is made available under the MIT license.

export function calculateSobel(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;

  const kernelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];

  const kernelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  const sobelData = new Uint8ClampedArray(width * height * 4);
  const greyscaleData = new Uint8ClampedArray(width * height * 4);

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
  let x, y;

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
      const pixelX =
        kernelX[0][0] * greyscalePixelAt(x - 1, y - 1) +
        kernelX[0][1] * greyscalePixelAt(x, y - 1) +
        kernelX[0][2] * greyscalePixelAt(x + 1, y - 1) +
        kernelX[1][0] * greyscalePixelAt(x - 1, y) +
        kernelX[1][1] * greyscalePixelAt(x, y) +
        kernelX[1][2] * greyscalePixelAt(x + 1, y) +
        kernelX[2][0] * greyscalePixelAt(x - 1, y + 1) +
        kernelX[2][1] * greyscalePixelAt(x, y + 1) +
        kernelX[2][2] * greyscalePixelAt(x + 1, y + 1);

      const pixelY =
        kernelY[0][0] * greyscalePixelAt(x - 1, y - 1) +
        kernelY[0][1] * greyscalePixelAt(x, y - 1) +
        kernelY[0][2] * greyscalePixelAt(x + 1, y - 1) +
        kernelY[1][0] * greyscalePixelAt(x - 1, y) +
        kernelY[1][1] * greyscalePixelAt(x, y) +
        kernelY[1][2] * greyscalePixelAt(x + 1, y) +
        kernelY[2][0] * greyscalePixelAt(x - 1, y + 1) +
        kernelY[2][1] * greyscalePixelAt(x, y + 1) +
        kernelY[2][2] * greyscalePixelAt(x + 1, y + 1);

      const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY) >>> 0;
      console.log(magnitude);
      if (magnitude > magnitudeMax) {
        magnitudeMax = magnitude;
      }
      setSobelPixelAt(x, y, magnitude, magnitude, magnitude, 255);
    }
  }

  console.log(magnitudeMax);
  return new ImageData(sobelData, width, height);
}
