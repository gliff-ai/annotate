export function drawImageOnCanvas(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | ImageData,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  }
): void {
  // Defaults
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // How much do we need to shrink the image to fit it all in?
  const imageWidth = image.width;
  const imageHeight = image.height;
  const ratio = Math.min(w / imageWidth, h / imageHeight);

  let newWidth = imageWidth * ratio; // scaled image width;
  let newHeight = imageHeight * ratio; // scaled image height

  newWidth *= scaleAndPan.scale;
  newHeight *= scaleAndPan.scale;

  const offsetX = w / 2 - newWidth / 2 + scaleAndPan.x;
  const offsetY = h / 2 - newHeight / 2 + scaleAndPan.y;

  // fill image in dest. rectangle
  if (image instanceof HTMLImageElement) {
    ctx.drawImage(image, offsetX, offsetY, newWidth, newHeight);
  } else if (image instanceof ImageData) {
    ctx.putImageData(image, offsetX, offsetY); // FIXME seems not to actually work
  }
}
