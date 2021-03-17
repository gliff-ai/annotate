export interface AnnotationsDataArray extends Array<Annotation> {}

export interface Annotation {
  labels: string[];
  toolbox: string;
  spaceTimeInfo: ZTPoint;
  coordinates: XYPoint[];
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
