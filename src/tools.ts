export const Tools = {
  paintbrush: "paintbrush",
  eraser: "eraser",
  spline: "spline",
} as const;

export type Tool = typeof Tools[keyof typeof Tools];
