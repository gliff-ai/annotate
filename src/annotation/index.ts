import {
  Annotation,
  XYPoint,
  BrushStroke,
  Spline,
  AuditAction,
} from "./interfaces";

export class Annotations {
  private data: Array<Annotation>;

  private activeAnnotationID: number;

  private audit: Array<AuditAction>;

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

    this.audit.push({
      method: "addAnnotation",
      args: [toolbox, labels, spline, brushStrokes, parameters],
    });
  };

  deleteActiveAnnotation = (): void => {
    this.data.splice(this.activeAnnotationID, 1);
    if (this.activeAnnotationID >= this.data.length) {
      this.activeAnnotationID = this.data.length - 1; // necessary if we delete the one on the end
    }
    if (this.data.length === 0) {
      this.addAnnotation("paintbrush"); // re-create a new empty annotation if we delete the last one (toolbox will be re-assigned by reuseEmptyAnnotation if necessary)
    }

    this.audit.push({ method: "deleteActiveAnnotation", args: [] });
  };

  getLabels = (): string[] => this.data[this.activeAnnotationID].labels;

  getActiveAnnotationID = (): number => this.activeAnnotationID;

  getActiveAnnotationColor = (): string =>
    this.data[this.activeAnnotationID].brushStrokes[0]?.brush.color;

  getSplineForActiveAnnotation = (): Spline =>
    this.data[this.activeAnnotationID].spline;

  getSplineCoordinates = (): Array<XYPoint> =>
    JSON.parse(
      JSON.stringify(this.data[this.activeAnnotationID].spline.coordinates)
    ) as Array<XYPoint>;

  getSplineLength = (): number =>
    this.data[this.activeAnnotationID].spline.coordinates.length;

  isActiveAnnotationEmpty = (): boolean =>
    // Check whether the active annotation object contains any
    // paintbrush or spline annotations.
    this.data[this.activeAnnotationID].spline.coordinates.length === 0 &&
    this.data[this.activeAnnotationID].brushStrokes.length === 0;

  getAllAnnotations = (): Annotation[] =>
    JSON.parse(JSON.stringify(this.data)) as Annotation[]; // deep copy to ensure no modification without audit logging

  getAllSplines = (z: number): Array<[Spline, number]> => {
    // returns an array of [spline, index] pairs for all splines at the given z-index.
    // index needed for identifying the active spline
    const splines: Array<[Spline, number]> = [];

    this.data.forEach((annotation, i) => {
      if (
        (annotation.toolbox === "spline" ||
          annotation.toolbox === "magicspline") &&
        annotation.spline.spaceTimeInfo.z === z
      ) {
        splines.push([annotation.spline, i]);
      }
    });

    return splines;
  };

  length = (): number => this.data.length;

  addLabel = (newLabel: string): void => {
    if (!this.data[this.activeAnnotationID].labels.includes(newLabel)) {
      this.data[this.activeAnnotationID].labels.push(newLabel);
    }

    this.audit.push({ method: "addLabel", args: [newLabel] });
  };

  removeLabel = (existingLabel: string): void => {
    this.data[this.activeAnnotationID].labels = this.data[
      this.activeAnnotationID
    ].labels.filter((label) => label !== existingLabel);

    this.audit.push({ method: "removeLabel", args: [existingLabel] });
  };

  setActiveAnnotationID = (id: number): void => {
    this.activeAnnotationID = id;

    this.audit.push({ method: "setActiveAnnotationID", args: [id] });
  };

  addBrushStroke = (newBrushStroke: BrushStroke): void => {
    if (
      ["paintbrush", "eraser"].includes(
        this.data[this.activeAnnotationID].toolbox
      )
    ) {
      this.data[this.activeAnnotationID].brushStrokes.push(newBrushStroke);
    }

    this.audit.push({ method: "addBrushStroke", args: [newBrushStroke] });
  };

  clearBrushStrokes = (): void => {
    this.data[this.activeAnnotationID].brushStrokes = [];

    this.audit.push({ method: "clearBrushStrokes", args: [] });
  };

  clearSplineCoordinates = (): void => {
    this.data[this.activeAnnotationID].spline.coordinates = [];

    this.audit.push({ method: "clearSplineCoordinates", args: [] });
  };

  addSplinePoint = (point: XYPoint): void => {
    if (
      ["spline", "magicspline"].includes(
        this.data[this.activeAnnotationID].toolbox
      )
    ) {
      this.data[this.activeAnnotationID].spline.coordinates.push(point);
    }

    this.audit.push({ method: "addSplinePoint", args: [point] });
  };

  deleteSplinePoint = (idx: number): void => {
    this.data[this.activeAnnotationID].spline.coordinates.splice(idx, 1);

    this.audit.push({ method: "deleteSplinePoint", args: [idx] });
  };

  updateSplinePoint = (newX: number, newY: number, index: number): void => {
    this.data[this.activeAnnotationID].spline.coordinates[index] = {
      x: newX,
      y: newY,
    };

    this.audit.push({ method: "updateSplinePoint", args: [newX, newY, index] });
  };

  insertSplinePoint = (idx: number, point: XYPoint): void => {
    this.data[this.activeAnnotationID].spline.coordinates.splice(idx, 0, point);

    this.audit.push({ method: "insertSplinePoint", args: [idx, point] });
  };

  setActiveAnnotationToolbox = (newToolbox: string): void => {
    this.data[this.activeAnnotationID].toolbox = newToolbox;

    this.audit.push({
      method: "setActiveAnnotationToolbox",
      args: [newToolbox],
    });
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

    this.audit.push({ method: "setSplineSpaceTimeInfo", args: [z, t] });
  };
}
