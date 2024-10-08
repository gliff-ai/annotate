export function getDataFromImageBitmap(
  imageBitmap: ImageBitmap
): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  ctx.drawImage(imageBitmap, 0, 0);

  return ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height).data;
}

export function getNewImageSizeAndDisplacement(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | ImageBitmap | ImageData,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  }
): { offsetX: number; offsetY: number; newWidth: number; newHeight: number } {
  // Given the current scale and pan, calculate the size and displacement of the image
  // so that this fits inside the canvas.

  const { width, height } = ctx.canvas;

  // How much do we need to shrink the image to fit it all in?
  const imageWidth = img.width;
  const imageHeight = img.height;
  const ratio = Math.min(width / imageWidth, height / imageHeight);

  let newWidth = imageWidth * ratio; // scaled image width;
  let newHeight = imageHeight * ratio; // scaled image height

  newWidth *= scaleAndPan.scale;
  newHeight *= scaleAndPan.scale;

  const offsetX = width / 2 - newWidth / 2 + scaleAndPan.x;
  const offsetY = height / 2 - newHeight / 2 + scaleAndPan.y;
  return { offsetX, offsetY, newWidth, newHeight }; // used as the destination rectangle in ctx.drawImage
}

function resizeImageData(
  img: ImageData,
  newWidth: number,
  newHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const scaledCanvas = canvas;
  scaledCanvas.getContext("2d").putImageData(img, 0, 0);
  scaledCanvas
    .getContext("2d")
    .scale(newWidth / img.width, newHeight / img.height);
  return scaledCanvas;
}

export function drawImageOnCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | ImageBitmap | ImageData,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  },
  edgeColour?: string,
  lineWidth?: number
): void {
  const { offsetX, offsetY, newWidth, newHeight } =
    getNewImageSizeAndDisplacement(ctx, img, scaleAndPan);

  if (img instanceof ImageData) {
    const scaledCanvas = resizeImageData(img, newWidth, newHeight);
    ctx.drawImage(scaledCanvas, offsetX, offsetY, newWidth, newHeight);
  } else {
    ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
  }

  // Draw edge around the image
  if (edgeColour) {
    const lw = lineWidth || 1;
    ctx.beginPath();
    /* eslint-disable no-param-reassign */
    ctx.strokeStyle = edgeColour;
    ctx.lineWidth = lw;
    ctx.strokeRect(
      offsetX - lw,
      offsetY - lw,
      newWidth + lw * 2,
      newHeight + lw * 2
    );
  }
}

export function getImageDataFromCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | ImageBitmap,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  }
): ImageData {
  const { offsetX, offsetY, newWidth, newHeight } =
    getNewImageSizeAndDisplacement(ctx, img, scaleAndPan);

  return ctx.getImageData(offsetX, offsetY, newWidth, newHeight);
}
