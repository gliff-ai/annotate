import { XYPoint, ZTPoint } from "@/annotation/interfaces";

export interface BoundingBoxCoordinates {
  topLeft: XYPoint | { x: null; y: null };
  bottomRight: XYPoint | { x: null; y: null };
}

export interface BoundingBox {
  coordinates: BoundingBoxCoordinates;
  spaceTimeInfo: ZTPoint;
}
