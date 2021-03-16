export interface Annotations {
  [layer: number]: {
    labels: string[];
    toolbox: string;
    spaceTimeInfo: ZTPoint;
    annotation: AnnotationVector;
  };
}

export interface AnnotationVector {
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
