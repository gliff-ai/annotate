import { BrushStroke } from "@/toolboxes/paintbrush";
import { Spline } from "@/toolboxes/spline";

export interface Annotation {
  labels: string[];
  toolbox: string;
  spline: Spline;
  brushStrokes: BrushStroke[];
  parameters: Record<string, unknown>;
}
export interface XYPoint {
  x: number;
  y: number;
}

export interface ZTPoint {
  z: number;
  t: number;
}

export interface PositionAndSize {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

export interface AuditAction {
  method: string;
  args: string;
  timestamp: number; // milliseconds since epoch
}
