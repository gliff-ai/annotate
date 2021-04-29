export interface BrushStrokes {
  // Todo move this into Paintbrush Toolbox
  coordinates: XYPoint[];
  brush: {
    radius: number;
    type: "paint" | "erase";
    color: string; // rgb(a) string
  };
}

export interface Annotation {
  labels: string[];
  toolbox: string;
  spaceTimeInfo: ZTPoint;
  coordinates: XYPoint[];
  brushStrokes: BrushStrokes[];
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
