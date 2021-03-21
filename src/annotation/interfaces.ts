export interface AnnotationsDataArray extends Array<Annotation> {}

export interface BrushStrokes {
  coordinates: XYPoint[];
  brushColor: string;
  brushRadius: number;
}
export interface Annotation {
  labels: string[];
  toolbox: string;
  spaceTimeInfo: ZTPoint;
  coordinates: XYPoint[];
  brushStrokes: BrushStrokes[];
  parameters: AnnotationParameters;
}

export interface AnnotationParameters {}

export interface XYPoint {
  x: number;
  y: number;
}

export interface ZTPoint {
  z: number;
  t: number;
}

export interface PositionAndSize {
  top: number;
  left: number;
  width: number;
  height: number;
}
