import { Annotation, XYPoint, BrushStroke, Spline } from "./interfaces";

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

  getLabels = (): string[] => this.data[this.activeAnnotationID].labels;

  getActiveAnnotationID = (): number => this.activeAnnotationID;

  getActiveAnnotationColor = (): string =>
    this.data[this.activeAnnotationID].brushStrokes[0]?.brush.color;

  getSplineForActiveAnnotation = (): Spline =>
    this.data[this.activeAnnotationID].spline;

  getSplineCoordinates = (): Array<XYPoint> => {
    return JSON.parse(
      JSON.stringify(this.data[this.activeAnnotationID].spline.coordinates)
    );
  };

  isActiveAnnotationEmpty = (): boolean =>
    // Check whether the active annotation object contains any
    // paintbrush or spline annotations.
    this.data[this.activeAnnotationID].spline.coordinates.length === 0 &&
    this.data[this.activeAnnotationID].brushStrokes.length === 0;

  getAllAnnotations = (): Annotation[] => JSON.parse(JSON.stringify(this.data)); // deep copy to ensure no modification without audit logging

  getAllSplines = (z: number): Array<[Spline, number]> => {
    // returns an array of [spline, index] pairs for all splines at the given z-index.
    // index needed for identifying the active spline
    const annotations = this.data.filter(
      (annotation: Annotation) =>
        (annotation.toolbox === "spline" || annotation.toolbox === "magic") &&
        annotation.spline.spaceTimeInfo.z === z
    );
    return annotations.map((annotation: Annotation, i) => [
      annotation.spline,
      i,
    ]);
  };

  length = (): number => this.data.length;

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

  setActiveAnnotationID = (id: number): void => {
    this.activeAnnotationID = id;
  };

  setSplineCoordinates = (newCoordinates: XYPoint[]): void => {
    this.data[this.activeAnnotationID].spline.coordinates = newCoordinates;
  };

  addBrushStroke = (newBrushStroke: BrushStroke): void => {
    this.data[this.activeAnnotationID].brushStrokes.push(newBrushStroke);
  };

  clearBrushStrokes = (): void => {
    this.data[this.activeAnnotationID].brushStrokes = [];
  };

  addSplinePoint = (point: XYPoint): void => {
    this.data[this.activeAnnotationID].spline.coordinates.push(point);
  };

  updateSplinePoint = (newX: number, newY: number, index: number): void => {
    this.data[this.activeAnnotationID].spline.coordinates[index] = {
      x: newX,
      y: newY,
    };
  };

  insertSplinePoint = (idx: number, point: XYPoint): void => {
    this.data[this.activeAnnotationID].spline.coordinates.splice(idx, 0, point);
  };

  setActiveAnnotationToolbox = (newToolbox: string): void => {
    this.data[this.activeAnnotationID].toolbox = newToolbox;
  };

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
