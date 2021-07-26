import { BoundingBox, BoundingBoxCoordinates } from "@/toolboxes/boundingBox";
import { BrushStroke } from "@/toolboxes/paintbrush";
import { Spline } from "@/toolboxes/spline";
import {
  Annotation,
  XYPoint,
  AuditAction,
  UndoRedo,
  CanUndoRedo,
  UndoRedoAction,
} from "./interfaces";

interface Descriptor extends Omit<PropertyDescriptor, "value"> {
  // Ideally this would be the methods of Annotations
  value?: (...args: unknown[]) => unknown;
}

function log(
  target: Annotations,
  propertyKey: string,
  descriptor: Descriptor
): void {
  const targetMethod = descriptor.value;

  descriptor.value = function auditWrapper(...args) {
    (this as Annotations).addAudit(propertyKey, args);

    return targetMethod.apply(this, args);
  };
}

export class Annotations {
  private data: Annotation[];

  private activeAnnotationID: number;

  private audit: AuditAction[];

  private undoData: UndoRedo[];

  private redoData: UndoRedo[];

  constructor(data?: Annotation[], audit?: AuditAction[]) {
    this.data = data || [];
    this.audit = audit || [];
    this.activeAnnotationID = 0;
  }

  @log
  addAnnotation(
    toolbox: string,
    labels: string[] = [],
    spline: Spline = {
      coordinates: [],
      spaceTimeInfo: { z: 0, t: 0 },
    },
    boundingBox: BoundingBox = {
      coordinates: {
        topLeft: { x: null, y: null },
        bottomRight: { x: null, y: null },
      },
      spaceTimeInfo: { z: 0, t: 0 },
    },
    brushStrokes: BrushStroke[] = [],
    parameters: Annotation["parameters"] = {}
  ): void {
    this.activeAnnotationID =
      this.data.push({
        labels,
        toolbox,
        spline,
        boundingBox,
        brushStrokes,
        parameters,
      }) - 1;

    this.initUndoRedo();
  }

  @log
  deleteActiveAnnotation(): void {
    this.data.splice(this.activeAnnotationID, 1);
    if (this.activeAnnotationID >= this.data.length) {
      this.activeAnnotationID = this.data.length - 1; // necessary if we delete the one on the end
    }
    if (this.data.length === 0) {
      this.addAnnotation("paintbrush"); // re-create a new empty annotation if we delete the last one (toolbox will be re-assigned by reuseEmptyAnnotation if necessary)
    }
    this.initUndoRedo();
  }

  getActiveAnnotationID = (): number => this.activeAnnotationID;

  getActiveAnnotationColor = (): string =>
    this.data[this.activeAnnotationID].brushStrokes[0]?.brush.color;

  isActiveAnnotationEmpty = (): boolean =>
    // Check whether the active annotation object contains any annotations.
    this.data[this.activeAnnotationID].spline.coordinates.length === 0 &&
    this.data[this.activeAnnotationID].brushStrokes.length === 0;

  getAllAnnotations = (): Annotation[] =>
    JSON.parse(JSON.stringify(this.data)) as Annotation[]; // deep copy to ensure no modification without audit logging

  length = (): number => this.data.length;

  @log
  setActiveAnnotationID(id: number): void {
    this.activeAnnotationID = id;
  }

  @log
  setActiveAnnotationToolbox(newToolbox: string): void {
    this.data[this.activeAnnotationID].toolbox = newToolbox;
  }

  // LABELS
  @log
  addLabel(newLabel: string): void {
    if (!this.data[this.activeAnnotationID].labels.includes(newLabel)) {
      this.data[this.activeAnnotationID].labels.push(newLabel);
    }
  }

  @log
  removeLabel(existingLabel: string): void {
    this.data[this.activeAnnotationID].labels = this.data[
      this.activeAnnotationID
    ].labels.filter((label) => label !== existingLabel);
  }

  getLabels = (): string[] => this.data[this.activeAnnotationID].labels;

  // BOUNDING BOXES
  getBoundingBoxForActiveAnnotation = (): BoundingBox =>
    this.data[this.activeAnnotationID].boundingBox;

  getBoundingBoxCoordinates = (): BoundingBoxCoordinates => {
    const tl = JSON.parse(
      JSON.stringify(
        this.data[this.activeAnnotationID].boundingBox.coordinates.topLeft
      )
    ) as XYPoint;
    const br = JSON.parse(
      JSON.stringify(
        this.data[this.activeAnnotationID].boundingBox.coordinates.bottomRight
      )
    ) as XYPoint;
    return { topLeft: tl, bottomRight: br };
  };

  getAllBoundingBoxes = (z: number): Array<[BoundingBox, number]> => {
    // returns an array of [BoundingBox, index] pairs
    // for all BoundingBox at the given z-index.
    // index needed for identifying the active spline
    const boundingBoxes: Array<[BoundingBox, number]> = [];

    this.data.forEach((annotation, i) => {
      if (
        annotation.toolbox === "boundingBox" &&
        annotation.spline.spaceTimeInfo.z === z
      ) {
        boundingBoxes.push([annotation.boundingBox, i]);
      }
    });

    return boundingBoxes;
  };

  @log
  clearBoundingBoxCoordinates(): void {
    this.data[this.activeAnnotationID].boundingBox.coordinates = {
      topLeft: null,
      bottomRight: null,
    };
  }

  @log
  updateBoundingBoxCoordinates(coordinates: BoundingBoxCoordinates): void {
    if (this.data[this.activeAnnotationID].toolbox === "boundingBox") {
      this.data[this.activeAnnotationID].boundingBox.coordinates = coordinates;
    }
  }

  @log
  setBoundingBoxTimeInfo(z?: number, t?: number): void {
    // Set space and time data for bounding box of active annotation.
    if (z === undefined && t === undefined) return;
    const { z: prevZ, t: prevT } =
      this.data[this.activeAnnotationID].boundingBox.spaceTimeInfo;
    this.data[this.activeAnnotationID].boundingBox.spaceTimeInfo = {
      z: z || prevZ,
      t: t || prevT,
    };
  }

  clickNearBoundingBox = (
    imageX: number,
    imageY: number,
    sliceIndex: number
  ): number => {
    // Check if point clicked (in image space) is near an existing boundingBox.
    // If true, return annotation index, otherwise return null.

    const boundingBoxes = this.getAllBoundingBoxes(sliceIndex);
    for (let i = 0; i < boundingBoxes.length; i += 1) {
      // index here is the index of the annotation this spline is from among all annotations,
      // not the index within each `boundingBox`

      const [boundingBox, index] = boundingBoxes[i];
      // here `i` is the index of the boundingBox in `boundingBoxes`, while `index` is the index of the boundingBox in all annotations

      // For each boundingBox, check if point clicked is near rectangle edges
      if (
        this.isClickNearBoundingBoxEdge(
          { x: imageX, y: imageY },
          boundingBox.coordinates
        )
      ) {
        return index;
      }
    }

    return null;
  };

  isClickNearBoundingBoxEdge = (
    p: XYPoint, // test point
    { topLeft, bottomRight }: BoundingBoxCoordinates, // TL, BR of rect
    distanceThreshold = 12
  ): boolean => {
    // get the four corners (plus an extra corner to close the loop)
    // and use isClickNearLineSegment for ease
    const topRight: XYPoint = { x: topLeft.x, y: bottomRight.y };
    const bottomLeft: XYPoint = { x: bottomRight.x, y: topLeft.y };
    const corners: XYPoint[] = [
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      topLeft,
    ];

    // For each pair of corners, check if point clicked is near the line segment
    // having for end points two consecutive points in the spline
    for (let j = 1; j < corners.length; j += 1) {
      const result = this.isClickNearLineSegment(
        p,
        corners[j - 1],
        corners[j],
        distanceThreshold
      );
      if (result) {
        return result;
      }
    }

    return false;
  };

  // SPLINES
  getSplineForActiveAnnotation = (): Spline =>
    this.data[this.activeAnnotationID].spline;

  getSplineCoordinates = (): Array<XYPoint> =>
    JSON.parse(
      JSON.stringify(this.data[this.activeAnnotationID].spline.coordinates)
    ) as Array<XYPoint>;

  getSplineLength = (): number =>
    this.data[this.activeAnnotationID].spline.coordinates.length;

  getAllSplines = (z: number): Array<[Spline, number]> => {
    // returns an array of [spline, index] pairs for all splines at the given z-index.
    // index needed for identifying the active spline
    const splines: Array<[Spline, number]> = [];

    this.data.forEach((annotation, i) => {
      if (
        annotation.toolbox === "spline" &&
        annotation.spline.spaceTimeInfo.z === z
      ) {
        splines.push([annotation.spline, i]);
      }
    });

    return splines;
  };

  @log
  clearSplineCoordinates(): void {
    this.data[this.activeAnnotationID].spline.coordinates = [];
    this.initUndoRedo();
  }

  @log
  addSplinePoint(point: XYPoint, addToUndoRedo = true): void {
    if (this.data[this.activeAnnotationID].toolbox === "spline") {
      this.data[this.activeAnnotationID].spline.coordinates.push(point);
    }
    if (addToUndoRedo) {
      this.updateUndoRedoActions("deleteSplinePoint", [
        this.data[this.activeAnnotationID].spline.coordinates.length - 1,
      ]);
    }
  }

  @log
  deleteSplinePoint(idx: number, addToUndoRedo = true): void {
    const point = this.data[this.activeAnnotationID].spline.coordinates.splice(
      idx,
      1
    );
    if (addToUndoRedo) {
      this.updateUndoRedoActions("insertSplinePoint", [idx, point]);
    }
  }

  @log
  updateSplinePoint(
    newX: number,
    newY: number,
    index: number,
    addToUndoRedo = true
  ): void {
    const point = this.data[this.activeAnnotationID].spline.coordinates[index];
    this.data[this.activeAnnotationID].spline.coordinates[index] = {
      x: newX,
      y: newY,
    };
    if (addToUndoRedo) {
      this.updateUndoRedoActions("updateSplinePoint", [
        (newX = point.x),
        (newY = point.y),
        index,
      ]);
    }
  }

  @log
  insertSplinePoint(idx: number, point: XYPoint, addToUndoRedo = true): void {
    this.data[this.activeAnnotationID].spline.coordinates.splice(idx, 0, point);
    if (addToUndoRedo) {
      this.updateUndoRedoActions("deleteSplinePoint", [idx]);
    }
  }

  @log
  setSplineSpaceTimeInfo(z?: number, t?: number): void {
    // Set space and time data for spline of active annotation.
    if (z === undefined && t === undefined) return;
    const { z: prevZ, t: prevT } =
      this.data[this.activeAnnotationID].spline.spaceTimeInfo;
    this.data[this.activeAnnotationID].spline.spaceTimeInfo = {
      z: z || prevZ,
      t: t || prevT,
    };
  }

  clickNearSpline = (
    imageX: number,
    imageY: number,
    sliceIndex: number
  ): number => {
    // Check if point clicked (in image space) is near an existing spline.
    // If true, return annotation index, otherwise return null.

    const splines = this.getAllSplines(sliceIndex);
    for (let i = 0; i < splines.length; i += 1) {
      // index here is the index of the annotation this spline is from among all annotations,
      // not the index within `splines`

      const [spline, index] = splines[i];
      // here `i` is the index of the spline in `splines`, while `index` is the index of the spline in all annotations

      // For each pair of points, check if point clicked is near the line segment
      // having for end points two consecutive points in the spline
      for (let j = 1; j < spline.coordinates.length; j += 1) {
        if (
          this.isClickNearLineSegment(
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

  isClickNearLineSegment = (
    p: XYPoint, // test point
    a: XYPoint, // line segment endpoint 1
    b: XYPoint, // line segment endpoint 2
    distanceThreshold = 12
  ): boolean => {
    // returns true if point p is within a capsule with endpoints a and b, and radius `distanceThreshold`
    // math from https://iquilezles.org/www/articles/distfunctions/distfunctions.htm
    const pa: XYPoint = { x: p.x - a.x, y: p.y - a.y };
    const ba: XYPoint = { x: b.x - a.x, y: b.y - a.y };
    let h = (pa.x * ba.x + pa.y * ba.y) / (ba.x ** 2 + ba.y ** 2);
    h = Math.max(Math.min(h, 1), 0); // clamp between 0 and 1
    const r = Math.sqrt((pa.x - h * ba.x) ** 2 + (pa.y - h * ba.y) ** 2);
    return r < distanceThreshold;
  };

  // AUDIT
  addAudit(method: string, args: unknown): void {
    this.audit.push({
      method,
      args: JSON.stringify(args),
      timestamp: Date.now(),
    });
  }

  getAuditObject = (): Array<AuditAction> =>
    JSON.parse(JSON.stringify(this.audit)) as AuditAction[];

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

  // BRUSHES
  clickNearBrushStroke = (
    imageX: number,
    imageY: number,
    sliceIndex: number
  ): number => {
    // Check if point clicked is near an existing paintbrush annotation.
    // If true, return annotation index, otherwise return null.
    // If more than one annotation at clicked point, select first drawn.

    for (let i = 0; i < this.data.length; i += 1) {
      if (this.data[i].toolbox === "paintbrush") {
        let finalIndex = null;

        this.data[i].brushStrokes.forEach(
          ({ spaceTimeInfo, coordinates, brush }) => {
            if (spaceTimeInfo.z === sliceIndex) {
              for (let j = 0; j < coordinates.length - 1; j += 1) {
                if (
                  this.isClickNearLineSegment(
                    { x: imageX, y: imageY },
                    coordinates[j],
                    coordinates[j + 1],
                    brush.radius
                  )
                ) {
                  // If the region near the clicked point has been erased,
                  // finalIndex will be reset to null.
                  finalIndex = brush.type === "paint" ? i : null;
                }
              }
            }
          }
        );
        if (finalIndex !== null) return i;
      }
    }
    return null;
  };

  @log
  addBrushStroke(newBrushStroke: BrushStroke): void {
    if (
      ["paintbrush", "eraser"].includes(
        this.data[this.activeAnnotationID].toolbox
      )
    ) {
      this.data[this.activeAnnotationID].brushStrokes.push(newBrushStroke);
    }
  }

  @log
  clearBrushStrokes(): void {
    this.data[this.activeAnnotationID].brushStrokes = [];
  }

  // UNDO/REDO
  canUndo = (): boolean => this.undoData.length > 0;

  canRedo = (): boolean => this.redoData.length > 0;

  canUndoRedo = () => ({ undo: this.canUndo(), redo: this.canRedo() });

  private initUndoRedo = () => {
    this.undoData = [];
    this.redoData = [];
  };

  private updateUndoRedoActions = (method: string, args: unknown): void => {
    this.undoData.push({
      undoAction: {
        method: method,
        args: JSON.stringify(args),
      },
      redoAction: this.audit[this.audit.length - 1],
    });
  };

  private applyAction = (
    action: UndoRedoAction | AuditAction,
    addToUndoRedo = true
  ): void => {
    const method = this[action.method as keyof Annotations];
    method.apply(this, [...JSON.parse(action.args), addToUndoRedo]);
  };

  undo(): CanUndoRedo {
    const canUndoRedo = this.canUndoRedo();
    if (canUndoRedo.undo) {
      const undoRedo = this.undoData.pop();
      this.applyAction(undoRedo.undoAction, false);
      this.redoData.push(undoRedo);
    }
    return canUndoRedo;
  }

  redo(): CanUndoRedo {
    const canUndoRedo = this.canUndoRedo();
    if (canUndoRedo.redo) {
      const undoRedo = this.redoData.pop();
      this.applyAction(undoRedo.redoAction, false);
      this.undoData.push(undoRedo);
    }
    return canUndoRedo;
  }
}
