import { XYPoint, ZTPoint } from "@/annotation/interfaces";

export interface Spline {
  coordinates: XYPoint[];
  spaceTimeInfo: ZTPoint;
}
