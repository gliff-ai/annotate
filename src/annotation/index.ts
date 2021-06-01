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

  private audit: Array<AuditAction> = [];

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
      args: JSON.stringify([toolbox, labels, spline, brushStrokes, parameters]),
      timestamp: Date.now(),
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

    this.audit.push({
      method: "deleteActiveAnnotation",
      args: JSON.stringify([]),
      timestamp: Date.now(),
    });
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

    this.audit.push({
      method: "addLabel",
      args: JSON.stringify([newLabel]),
      timestamp: Date.now(),
    });
  };

  removeLabel = (existingLabel: string): void => {
    this.data[this.activeAnnotationID].labels = this.data[
      this.activeAnnotationID
    ].labels.filter((label) => label !== existingLabel);

    this.audit.push({
      method: "removeLabel",
      args: JSON.stringify([existingLabel]),
      timestamp: Date.now(),
    });
  };

  setActiveAnnotationID = (id: number): void => {
    this.activeAnnotationID = id;

    this.audit.push({
      method: "setActiveAnnotationID",
      args: JSON.stringify([id]),
      timestamp: Date.now(),
    });
  };

  addBrushStroke = (newBrushStroke: BrushStroke): void => {
    if (
      ["paintbrush", "eraser"].includes(
        this.data[this.activeAnnotationID].toolbox
      )
    ) {
      this.data[this.activeAnnotationID].brushStrokes.push(newBrushStroke);
    }

    this.audit.push({
      method: "addBrushStroke",
      args: JSON.stringify([newBrushStroke]),
      timestamp: Date.now(),
    });
  };

  clearBrushStrokes = (): void => {
    this.data[this.activeAnnotationID].brushStrokes = [];

    this.audit.push({
      method: "clearBrushStrokes",
      args: JSON.stringify([]),
      timestamp: Date.now(),
    });
  };

  clearSplineCoordinates = (): void => {
    this.data[this.activeAnnotationID].spline.coordinates = [];

    this.audit.push({
      method: "clearSplineCoordinates",
      args: JSON.stringify([]),
      timestamp: Date.now(),
    });
  };

  addSplinePoint = (point: XYPoint): void => {
    if (
      ["spline", "magicspline"].includes(
        this.data[this.activeAnnotationID].toolbox
      )
    ) {
      this.data[this.activeAnnotationID].spline.coordinates.push(point);
    }

    this.audit.push({
      method: "addSplinePoint",
      args: JSON.stringify([point]),
      timestamp: Date.now(),
    });
  };

  deleteSplinePoint = (idx: number): void => {
    this.data[this.activeAnnotationID].spline.coordinates.splice(idx, 1);

    this.audit.push({
      method: "deleteSplinePoint",
      args: JSON.stringify([idx]),
      timestamp: Date.now(),
    });
  };

  updateSplinePoint = (newX: number, newY: number, index: number): void => {
    this.data[this.activeAnnotationID].spline.coordinates[index] = {
      x: newX,
      y: newY,
    };

    this.audit.push({
      method: "updateSplinePoint",
      args: JSON.stringify([newX, newY, index]),
      timestamp: Date.now(),
    });
  };

  insertSplinePoint = (idx: number, point: XYPoint): void => {
    this.data[this.activeAnnotationID].spline.coordinates.splice(idx, 0, point);

    this.audit.push({
      method: "insertSplinePoint",
      args: JSON.stringify([idx, point]),
      timestamp: Date.now(),
    });
  };

  setActiveAnnotationToolbox = (newToolbox: string): void => {
    this.data[this.activeAnnotationID].toolbox = newToolbox;

    this.audit.push({
      method: "setActiveAnnotationToolbox",
      args: JSON.stringify([newToolbox]),
      timestamp: Date.now(),
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

    this.audit.push({
      method: "setSplineSpaceTimeInfo",
      args: JSON.stringify([z, t]),
      timestamp: Date.now(),
    });
  };

  getAuditObject = (): Array<AuditAction> => this.audit;

  popAuditObject = (): Array<AuditAction> => {
    // returns the audit array and deletes it from this object, so they can be stored separately without duplicating data

    const { audit } = this;
    this.audit = [];
    return audit;
  };

  testAudit = (): boolean => {
    // make a new Annotations object and apply the AuditActions from this.audit to it one by one
    // if its resulting state is not identical to this object's state, then there's a problem

    const annotationsObject = new Annotations();

    for (const action of this.audit) {
      const method = annotationsObject[action.method as keyof Annotations];
      method.apply(annotationsObject, JSON.parse(action.args));
    }

    return JSON.stringify(this.data) === JSON.stringify(annotationsObject.data);
  };

  clickNearBrushStroke = (
    imageX: number,
    imageY: number,
    sliceIndex: number
  ): number => {
    // Check if point clicked is near an existing paintbrush annotation.
    // If true, return annotation index, otherwise return null.
    // If more than one annotation at clicked point, select first drawn.

    const isClickNearPoint = (
      point: XYPoint,
      point1: XYPoint,
      radius: number
    ): boolean =>
      Math.abs(point.x - point1.x) < radius &&
      Math.abs(point.y - point1.y) < radius;

    for (let i = 0; i < this.data.length; i += 1) {
      if (this.data[i].toolbox === "paintbrush") {
        let finalIndex = null;

        this.data[i].brushStrokes.forEach(
          ({ spaceTimeInfo, coordinates, brush }) => {
            if (spaceTimeInfo.z === sliceIndex) {
              coordinates.forEach((point: XYPoint) => {
                if (
                  isClickNearPoint(
                    { x: imageX, y: imageY },
                    point,
                    brush.radius
                  )
                ) {
                  // If the region near the clicked point has been erased,
                  // finalIndex will be reset to null.
                  finalIndex = brush.type === "paint" ? i : null;
                }
              });
            }
          }
        );
        if (finalIndex !== null) return i;
      }
    }
    return null;
  };

  clickNearSpline = (
    imageX: number,
    imageY: number,
    sliceIndex: number
  ): number => {
    // Check if point clicked (in image space) is near an existing spline.
    // If true, return annotation index, otherwise return null.

    const isClickNearLineSegment = (
      point: XYPoint,
      point1: XYPoint,
      point2: XYPoint
    ): boolean => {
      // Check if a XYpoint belongs to the line segment with endpoints XYpoint 1 and XYpoint 2.
      const dx = point.x - point1.x;
      const dy = point.y - point1.y;
      const dxLine = point2.x - point1.x;
      const dyLine = point2.y - point1.y;
      const distance = 700;
      // Use the cross-product to check whether the XYpoint lies on the line passing
      // through XYpoint 1 and XYpoint 2.
      const crossProduct = dx * dyLine - dy * dxLine;
      // If the XYpoint is exactly on the line the cross-product is zero. Here we set a threshold
      // based on ease of use, to accept points that are close enough to the spline.
      if (Math.abs(crossProduct) > distance) return false;

      // Check if the point is on the segment (i.e., between point 1 and point 2).
      if (Math.abs(dxLine) >= Math.abs(dyLine)) {
        return dxLine > 0
          ? point1.x <= point.x && point.x <= point2.x
          : point2.x <= point.x && point.x <= point1.x;
      }
      return dyLine > 0
        ? point1.y <= point.y && point.y <= point2.y
        : point2.y <= point.y && point.y <= point1.y;
    };

    const splines = this.getAllSplines(sliceIndex);
    for (let i = 0; i < splines.length; i += 1) {
      // index here is the index of the annotation this spline is from among all annotations,
      // not the index within `splines`

      const [spline, index] = splines[i];
      // here `i` is the index of the spline in `splines`, while `index` is the index of the spline in all annotations

      // For each pair of points, check if point clicked is near the line segment
      // having for end points two consecutive points in the spline:
      for (let j = 1; j < spline.coordinates.length; j += 1) {
        if (
          isClickNearLineSegment(
            { x: imageX, y: imageY },
            spline.coordinates[j - 1],
            spline.coordinates[j]
          )
        )
          return index;
      }
    }

    return null;
  };
}
