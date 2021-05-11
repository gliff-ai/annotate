import {
  Annotation,
  XYPoint,
  BrushStroke,
  Spline,
} from "./interfaces";

export class Annotations {
  private data: Array<Annotation>;

  private activeAnnotationID: number;

  constructor() {
    this.data = [];
    this.activeAnnotationID = null;
  }

  addAnnotation = (
    toolbox: string,
    labels: string[] = [],
    spline: Spline = {
      coordinates: [],
      spaceTimeInfo: { z: 0, t: 0 },
    },
    brushStrokes: BrushStroke[] = [],
    parameters: Annotation["parameters"] = {}
  ): void => {
    this.activeAnnotationID =
      this.data.push({
        labels,
        toolbox,
        spline,
        brushStrokes,
        parameters,
      }) - 1;
  };

  addLabel = (newLabel: string): void => {
    if (!this.data[this.activeAnnotationID].labels.includes(newLabel)) {
      this.data[this.activeAnnotationID].labels.push(newLabel);
    }
  };

  removeLabel = (existingLabel: string): void => {
    this.data[this.activeAnnotationID].labels = this.data[
      this.activeAnnotationID
    ].labels.filter((label) => label !== existingLabel);
  };

  getLabels = (): string[] => this.data[this.activeAnnotationID].labels;

  getActiveAnnotationID = (): number => this.activeAnnotationID;

  getActiveAnnotation = (): Annotation => this.data[this.activeAnnotationID];

  getSplineForActiveAnnotation = (): Spline =>
    this.data[this.activeAnnotationID].spline;

  length = (): number => this.data.length;

  setActiveAnnotationID = (id: number): void => {
    this.activeAnnotationID = id;
  };

  setSplineCoordinates = (newCoordinates: XYPoint[]): void => {
    this.data[this.activeAnnotationID].spline.coordinates = newCoordinates;
  };

  setAnnotationBrushStrokes = (newBrushStrokes: BrushStroke[]): void => {
    this.data[this.activeAnnotationID].brushStrokes = newBrushStrokes;
  };

  setActiveAnnotationToolbox = (newToolbox: string): void => {
    this.data[this.activeAnnotationID].toolbox = newToolbox;
  };

  isActiveAnnotationEmpty = (): boolean =>
    // Check whether the active annotation object contains any
    // paintbrush or spline annotations.
    this.data[this.activeAnnotationID].spline.coordinates.length === 0 &&
    this.data[this.activeAnnotationID].brushStrokes.length === 0;

  getAllAnnotations = (): Annotation[] => this.data;

  setSplineSpaceTimeInfo = (z?: number, t?: number): void => {
    // Set space and time data for spline of active annotation.
    if (z === undefined && t === undefined) return;
    const { z: prevZ, t: prevT } =
      this.data[this.activeAnnotationID].spline.spaceTimeInfo;
    this.data[this.activeAnnotationID].spline.spaceTimeInfo = {
      z: z || prevZ,
      t: t || prevT,
    };
  };
}
