export default function drawImageProp(ctx: any, img: HTMLImageElement): void {
  // Defaults
  let x = 0;
  let y = 0;
  let w = ctx.canvas.width;
  let h = ctx.canvas.height;

  // How much do we need to shrink the image to fit it all in
  const imageWidth = img.width;
  const imageHeight = img.height;
  const ratio = Math.min(w / imageWidth, h / imageHeight);

  let newWidth = imageWidth * ratio; // new prop. width;
  let newHeight = imageHeight * ratio; // new prop. height

  let offsetX = 0;
  let offsetY = 0;

  // deal with any offsets
  if (newWidth < w) offsetX = (w - newWidth) / 2;
  if (newHeight < h) offsetY = (h - newHeight) / 2;

  //   let offsetX = imageWidth - cw;
  //   let offsetY = imageHeight - ch;

  //   // make sure source rectangle is valid
  //   if (cx < 0) cx = 0;
  //   if (cy < 0) cy = 0;
  //   if (cw > imageWidth) cw = imageWidth;
  //   if (ch > imageHeight) ch = imageHeight;

  // fill image in dest. rectangle
  ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
}
