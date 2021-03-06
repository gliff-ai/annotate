import { BoundingBox } from "@/toolboxes/boundingBox";
import { BrushStroke } from "@/toolboxes/paintbrush";
import { Spline } from "@/toolboxes/spline";

export interface Annotation {
  labels: string[];
  toolbox: string;
  spline: Spline;
  brushStrokes: BrushStroke[];
  boundingBox: BoundingBox;
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

export type UndoRedoAction = Omit<AuditAction, "timestamp">;

export interface UndoRedo {
  undoAction: UndoRedoAction;
  redoAction: UndoRedoAction;
}

export type CanUndoRedo = { undo: boolean; redo: boolean };
