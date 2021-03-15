/**
 * Original from: https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas
 * Original By Ken Fyrstenberg Nilsen
 *
 * Note: img must be fully loaded or have correct width & height set.
 */
export default function drawImageProp({
  ctx,
  img,
  x,
  y,
  w,
  h,
  offsetX,
  offsetY,
} = {}) {
  // Defaults
  if (typeof x !== "number") x = 0;
  if (typeof y !== "number") y = 0;
  if (typeof w !== "number") w = ctx.canvas.width;
  if (typeof h !== "number") h = ctx.canvas.height;
  if (typeof offsetX !== "number") offsetX = 0.5;
  if (typeof offsetY !== "number") offsetY = 0.5;

  // keep bounds [0.0, 1.0]
  if (offsetX < 0) offsetX = 0;
  if (offsetY < 0) offsetY = 0;
  if (offsetX > 1) offsetX = 1;
  if (offsetY > 1) offsetY = 1;

  const imageWidth = img.width;
  const imageHeight = img.height;
  const ratio = Math.min(w / imageWidth, h / imageHeight);

  let newWidth = imageWidth * ratio; // new prop. width;
  let newHeight = imageHeight * ratio; // new prop. height
  let cx;
  let cy;
  let cw;
  let ch;
  let aspectRatio = 1;

  // decide which gap to fill
  if (newWidth < w) aspectRatio = w / newWidth;
  if (Math.abs(aspectRatio - 1) < 1e-14 && newHeight < h)
    aspectRatio = h / newHeight; // updated
  newWidth *= aspectRatio;
  newHeight *= aspectRatio;

  // calc source rectangle
  cw = imageWidth / (newWidth / w);
  ch = imageHeight / (newHeight / h);

  cx = (imageWidth - cw) * offsetX;
  cy = (imageHeight - ch) * offsetY;

  // make sure source rectangle is valid
  if (cx < 0) cx = 0;
  if (cy < 0) cy = 0;
  if (cw > imageWidth) cw = imageWidth;
  if (ch > imageHeight) ch = imageHeight;

  // fill image in dest. rectangle
  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}
