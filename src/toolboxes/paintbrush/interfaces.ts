import { XYPoint, ZTPoint } from "@/annotation/interfaces";

export interface Brush {
  radius: number;
  type: "paint" | "erase";
  color: string; // rgb(a) string
  is3D: boolean;
}

export interface BrushStroke {
  coordinates: XYPoint[];
  spaceTimeInfo: ZTPoint;
  brush: Brush;
}
