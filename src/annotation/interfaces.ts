export interface BrushStrokes {
  coordinates: XYPoint[];
  brushColor: string;
  brushRadius: number;
  brushType: string;
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
