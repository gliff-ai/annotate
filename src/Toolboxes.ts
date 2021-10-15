import { Tooltip } from "@gliff-ai/style";

export const Toolboxes = {
  background: "background",
  paintbrush: "paintbrush",
  spline: "spline",
  boundingBox: "boundingBox",
  ui: "ui",
} as const;

export type Toolbox = typeof Toolboxes[keyof typeof Toolboxes];
export type ToolTips = { [name: string]: Tooltip };
