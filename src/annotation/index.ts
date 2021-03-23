import {
  AnnotationsDataArray,
  Annotation,
  AnnotationParameters,
  ZTPoint,
  XYPoint,
  BrushStrokes,
  PositionAndSize,
} from "./interfaces";

export class Annotations {
  private data: AnnotationsDataArray;
  private activeAnnotationID: number;

  constructor() {
    this.data = [];
    this.activeAnnotationID = null;
  }

  addAnnotation = (
    toolbox: string,
    labels: string[] = [],
    spaceTimeInfo: ZTPoint = { z: 0, t: 0 },
    coordinates: XYPoint[] = [],
    brushStrokes: BrushStrokes[] = [],
    parameters: AnnotationParameters[] = []
  ): void => {
    this.activeAnnotationID =
      this.data.push({
        labels,
        toolbox,
        spaceTimeInfo,
        coordinates,
        brushStrokes,
        parameters,
      }) - 1;
  };

  addLabel = (activeAnnotation: number, newLabel: string): void => {
    this.data[activeAnnotation]["labels"].push(newLabel);
    // this.data[activeAnnotation]["labels"] = unique(this.data[activeAnnotation]["labels"]); // TODO
  };

  removeLabel = (activeAnnotation: number, existingLabel: string): void => {
    this.data[activeAnnotation]["labels"] = this.data[activeAnnotation][
      "labels"
    ].filter((label) => label != existingLabel);
  };

  getActiveAnnotationID = (): number => {
    return this.activeAnnotationID;
  };

  getActiveAnnotation = (): Annotation => {
    return this.data[this.activeAnnotationID];
  };

  length = (): number => {
    return this.data.length;
  };

  setAnnotationCoordinates = (newCoordinates: XYPoint[]): void => {
    this.data[this.activeAnnotationID]["coordinates"] = newCoordinates;
  };

  setActiveAnnotationToolbox = (newToolbox: string): void => {
    this.data[this.activeAnnotationID].toolbox = newToolbox;
  };

  isActiveAnnotationEmpty = (): boolean => {
    // Check whether the active annotation object contains any
    // paintbrush or spline annotations.
    return (
      this.data[this.activeAnnotationID].coordinates.length === 0 &&
      this.data[this.activeAnnotationID].brushStrokes.length === 0
    );
  };

  getAllAnnotations = (): AnnotationsDataArray => {
    return this.data;
  };
}
