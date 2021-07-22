import { XYPoint, ZTPoint } from "@/annotation/interfaces";

export interface BoundingBoxCoordinates {
  topLeft: XYPoint;
  bottomRight: XYPoint;
}

export interface BoundingBox {
  coordinates: BoundingBoxCoordinates;
  spaceTimeInfo: ZTPoint;
}
