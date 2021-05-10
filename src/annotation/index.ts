import { Annotation, ZTPoint, XYPoint, BrushStrokes } from "./interfaces";

export class Annotations {
  private data: Array<Annotation>;

  private activeAnnotationID: number;

  constructor() {
    this.data = [];
    this.activeAnnotationID = null;
  }

  addAnnotation = (
    toolbox: string,
    spaceTimeInfo: ZTPoint = { z: 0, t: 0 },
    labels: string[] = [],
    coordinates: XYPoint[] = [],
    brushStrokes: BrushStrokes[] = [],
    parameters: Annotation["parameters"] = {}
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

  length = (): number => this.data.length;

  setActiveAnnotationID = (id: number): void => {
    this.activeAnnotationID = id;
  };

  setAnnotationCoordinates = (newCoordinates: XYPoint[]): void => {
    this.data[this.activeAnnotationID].coordinates = newCoordinates;
  };

  setAnnotationBrushStrokes = (newBrushStrokes: BrushStrokes[]): void => {
    this.data[this.activeAnnotationID].brushStrokes = newBrushStrokes;
  };

  setActiveAnnotationToolbox = (newToolbox: string): void => {
    this.data[this.activeAnnotationID].toolbox = newToolbox;
  };

  isActiveAnnotationEmpty = (): boolean =>
    // Check whether the active annotation object contains any
    // paintbrush or spline annotations.
    this.data[this.activeAnnotationID].coordinates.length === 0 &&
    this.data[this.activeAnnotationID].brushStrokes.length === 0;

  getAllAnnotations = (): Annotation[] => this.data;

  setSpaceTimeInfo = (z?: number, t?: number): void => {
    // Set space and time data for active annotation.
    if (z === undefined && t === undefined) return;
    const { z: prevZ, t: prevT } = this.data[
      this.activeAnnotationID
    ].spaceTimeInfo;
    this.data[this.activeAnnotationID].spaceTimeInfo = {
      z: z || prevZ,
      t: t || prevT,
    };
  };
}
