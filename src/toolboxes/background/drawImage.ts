export default function drawImageOnCanvas(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
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
  const imageWidth = img.width;
  const imageHeight = img.height;
  const ratio = Math.min(w / imageWidth, h / imageHeight);

  let newWidth = imageWidth * ratio; // scaled image width;
  let newHeight = imageHeight * ratio; // scaled image height

  newWidth *= scaleAndPan.scale;
  newHeight *= scaleAndPan.scale;

  let offsetX = w / 2 - newWidth / 2 + scaleAndPan.x;
  let offsetY = h / 2 - newHeight / 2 + scaleAndPan.y;

  // fill image in dest. rectangle
  ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
}
