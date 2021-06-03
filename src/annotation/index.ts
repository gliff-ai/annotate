import {
  Annotation,
  XYPoint,
  BrushStroke,
  Spline,
  AuditAction,
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

  constructor(data?: Annotation[], audit?: AuditAction[]) {
    this.data = data || [];
    this.audit = audit || [];
    this.activeAnnotationID = null;
  }

  @log
  addAnnotation(
    toolbox: string,
    labels: string[] = [],
    spline: Spline = {
      coordinates: [],
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
        brushStrokes,
        parameters,
      }) - 1;
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
  }

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

  @log
  setActiveAnnotationID(id: number): void {
    this.activeAnnotationID = id;
  }

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

  @log
  clearSplineCoordinates(): void {
    this.data[this.activeAnnotationID].spline.coordinates = [];
  }

  @log
  addSplinePoint(point: XYPoint): void {
    if (
      ["spline", "magicspline"].includes(
        this.data[this.activeAnnotationID].toolbox
      )
    ) {
      this.data[this.activeAnnotationID].spline.coordinates.push(point);
    }
  }

  @log
  deleteSplinePoint(idx: number): void {
    this.data[this.activeAnnotationID].spline.coordinates.splice(idx, 1);
  }

  @log
  updateSplinePoint(newX: number, newY: number, index: number): void {
    this.data[this.activeAnnotationID].spline.coordinates[index] = {
      x: newX,
      y: newY,
    };
  }

  @log
  insertSplinePoint(idx: number, point: XYPoint): void {
    this.data[this.activeAnnotationID].spline.coordinates.splice(idx, 0, point);
  }

  @log
  setActiveAnnotationToolbox(newToolbox: string): void {
    this.data[this.activeAnnotationID].toolbox = newToolbox;
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
      // having for end points two consecutive points in the spline:
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
    threshold = 12
  ): boolean => {
    // returns true if point p is within a capsule with endpoints a and b, and radius `threshold`
    // math from https://iquilezles.org/www/articles/distfunctions/distfunctions.htm
    const pa: XYPoint = { x: p.x - a.x, y: p.y - a.y };
    const ba: XYPoint = { x: b.x - a.x, y: b.y - a.y };
    let h = (pa.x * ba.x + pa.y * ba.y) / (ba.x ** 2 + ba.y ** 2);
    h = Math.max(Math.min(h, 1), 0); // clamp between 0 and 1
    const r = Math.sqrt((pa.x - h * ba.x) ** 2 + (pa.y - h * ba.y) ** 2);
    return r < threshold;
  };
}
