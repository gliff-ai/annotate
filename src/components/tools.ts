export const Tools = {
  paintbrush: "paintbrush",
  eraser: "eraser",
  spline: "spline",
  magicspline: "magicspline",
} as const;

export type Tool = typeof Tools[keyof typeof Tools];
