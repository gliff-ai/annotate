import { XYPoint, ZTPoint } from "@/annotation/interfaces";

export interface BrushStroke {
  coordinates: XYPoint[];
  spaceTimeInfo: ZTPoint;
  brush: {
    radius: number;
    type: "paint" | "erase";
    color: string; // rgb(a) string
  };
}
