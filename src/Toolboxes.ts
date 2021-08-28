import { Tooltip } from "@gliff-ai/style";

export const Toolboxes = {
  paintbrush: "paintbrush",
  spline: "spline",
  boundingBox: "boundingBox",
} as const;

export type Toolbox = typeof Toolboxes[keyof typeof Toolboxes];
export type ToolTips = { [name: string]: Tooltip };
