export interface BrushStroke {
  // Todo move this into Paintbrush Toolbox
  coordinates: XYPoint[];
  spaceTimeInfo: ZTPoint;
  brush: {
    radius: number;
    type: "paint" | "erase";
    color: string; // rgb(a) string
  };
}
export interface Spline {
  coordinates: XYPoint[];
  spaceTimeInfo: ZTPoint;
}
export interface Annotation {
  labels: string[];
  toolbox: string;
  spline: Spline;
  brushStrokes: BrushStroke[];
  parameters: Record<string, unknown>;
}

// export interface AnnotationParameters {}

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
  args: Array<any>;
}
