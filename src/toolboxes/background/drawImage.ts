export default function drawImageOnCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
): void {
  // Defaults
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // How much do we need to shrink the image to fit it all in?
  const imageWidth = img.width;
  const imageHeight = img.height;
  const ratio = Math.min(w / imageWidth, h / imageHeight);

  const newWidth = imageWidth * ratio; // scaled image width;
  const newHeight = imageHeight * ratio; // scaled image height

  // deal with any offsets
  let offsetX = 0;
  let offsetY = 0;
  if (newWidth < w) offsetX = (w - newWidth) / 2;
  if (newHeight < h) offsetY = (h - newHeight) / 2;

  // fill image in dest. rectangle
  ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
}
