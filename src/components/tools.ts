export const Tools = {
  paintbrush: "paintbrush",
  eraser: "eraser",
  spline: "spline",
  boundingBox: "boundingBox",
} as const;

export type Tool = typeof Tools[keyof typeof Tools];
