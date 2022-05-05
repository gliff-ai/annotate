import { ReactNode, PureComponent, ReactElement } from "react";
import { theme } from "@gliff-ai/style";
import { Toolboxes, Toolbox } from "@/Toolboxes";
import { Mode } from "@/ui";
import { Annotations } from "@/annotation";
import { XYPoint, PositionAndSize } from "@/annotation/interfaces";
import { Spline } from "@/toolboxes/spline";
import { getRGBAString, palette } from "@/components/palette";
import {
  BaseCanvas,
  CanvasProps,
  canvasToImage,
  imageToCanvas,
} from "@/components/baseCanvas";
import { calculateSobel } from "./sobel";
import { useSplineStore } from "./Store";

interface Props extends Omit<CanvasProps, "canvasPositionAndSize"> {
  activeToolbox: Toolbox | string;
  mode: Mode;
  setMode: (mode: Mode) => void;
  annotationsObject: Annotations;
  // eslint-disable-next-line react/no-unused-prop-types
  redraw: number;
  sliceIndex: number;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveToolbox: (tool: Toolbox) => void;
}

interface State {
  canvasPositionAndSize: PositionAndSize;
}

export const events = [
  "deleteSelectedPoint",
  "deselectPoint",
  "closeSpline",
  "convertSpline",
  "fillSpline",
  "makeBezier",
] as const;

const mainColor = theme.palette.primary.main;
const secondaryColor = theme.palette.secondary.main;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";

class CanvasClass extends PureComponent<Props, State> {
  readonly name = Toolboxes.spline;

  private baseCanvas: BaseCanvas;

  private selectedPointIndex: number;

  private isDrawing: boolean; // currently drawing magic or lasso spline

  private dragPoint: XYPoint | null; // current position of dragged point, implies dragging if not null

  private gradientImage: ImageData;

  private numberOfMoves: number; // increments on mouse move; used to space out the magic spline points

  constructor(props: Props) {
    super(props);
    this.selectedPointIndex = -1;
    this.isDrawing = false;
    this.numberOfMoves = 0;
    this.dragPoint = null;
    this.state = {
      canvasPositionAndSize: { top: 0, left: 0, width: 0, height: 0 },
    };
  }

  componentDidMount(): void {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  }

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const spline = this.props.annotationsObject.getSplineForActiveAnnotation();

    if (spline?.coordinates) {
      this.drawAllSplines();
    }
  }

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handleEvent = (event: Event): void => {
    if ((event.detail as string).includes(this.name)) {
      this[event.type]?.call(this);
    }
  };

  drawSplineVector = (
    spline: Spline,
    isActive = false,
    color: string
  ): void => {
    const cubic = this.props.annotationsObject.splineIsBezier();

    let splineVector = spline.coordinates;

    if (splineVector.length === 0) return;

    // transform spline points to canvas space and shift one of them if we're dragging it:
    if (isActive && this.dragPoint) {
      if (cubic && this.selectedPointIndex % 3 === 0) {
        // dragging a Bezier curve node, so move the control points with it:
        const translation = {
          x: this.dragPoint.x - splineVector[this.selectedPointIndex].x,
          y: this.dragPoint.y - splineVector[this.selectedPointIndex].y,
        };
        if (this.selectedPointIndex > 0) {
          splineVector[this.selectedPointIndex - 1].x += translation.x;
          splineVector[this.selectedPointIndex - 1].y += translation.y;
        }
        if (this.selectedPointIndex < splineVector.length - 1) {
          splineVector[this.selectedPointIndex + 1].x += translation.x;
          splineVector[this.selectedPointIndex + 1].y += translation.y;
        }
        if (
          this.selectedPointIndex === 0 &&
          this.props.annotationsObject.splineIsClosed()
        ) {
          splineVector[splineVector.length - 1].x += translation.x;
          splineVector[splineVector.length - 1].y += translation.y;
        }
      }
      splineVector[this.selectedPointIndex] = this.dragPoint;
    }
    splineVector = splineVector.map((point) =>
      imageToCanvas(
        point.x,
        point.y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.state.canvasPositionAndSize
      )
    );

    const { canvasContext: context } = this.baseCanvas;
    const lineWidth = isActive ? 2 : 1;
    context.lineWidth = lineWidth;

    // Lines
    context.strokeStyle = isActive ? mainColor : color;

    // Squares
    context.fillStyle = secondaryColor;

    const pointSize = 6;

    if (splineVector.length > 1) {
      // Go to the first point
      context.beginPath();
      context.moveTo(splineVector[0].x, splineVector[0].y);

      if (cubic) {
        let i = 1;
        while (i + 2 < splineVector.length) {
          context.bezierCurveTo(
            splineVector[i].x,
            splineVector[i].y,
            splineVector[i + 1].x,
            splineVector[i + 1].y,
            splineVector[i + 2].x,
            splineVector[i + 2].y
          );
          i += 3;
        }
        if (
          this.props.annotationsObject.splineIsClosed() &&
          i + 2 == splineVector.length
        ) {
          // draw final arc to close the curve:
          context.bezierCurveTo(
            splineVector[i].x,
            splineVector[i].y,
            splineVector[i + 1].x,
            splineVector[i + 1].y,
            splineVector[0].x,
            splineVector[0].y
          );
        }
      } else {
        // Draw each point by taking our raw coordinates and applying the transform so they fit on our canvas
        for (const [idx, { x, y }] of splineVector.entries()) {
          context.lineTo(x, y);
        }
        if (spline.isClosed) {
          context.lineTo(splineVector[0].x, splineVector[0].y);
        }
      }

      context.stroke();

      if (cubic && isActive) {
        // draw lines to control points:
        context.beginPath();
        context.strokeStyle = getRGBAString(
          palette[
            this.props.annotationsObject.getActiveAnnotationID() %
              palette.length
          ]
        );
        context.lineWidth = 1;
        let i = 0;
        while (i < splineVector.length) {
          context.moveTo(splineVector[i].x, splineVector[i].y);
          if (i + 1 < splineVector.length) {
            context.lineTo(splineVector[i + 1].x, splineVector[i + 1].y);
          }
          context.moveTo(splineVector[i].x, splineVector[i].y);
          if (i > 0) {
            context.lineTo(splineVector[i - 1].x, splineVector[i - 1].y);
          }
          i += 3;
        }
        if (
          this.props.annotationsObject.splineIsClosed() &&
          i == splineVector.length
        ) {
          // draw line connecting first point with its "first" control point:
          context.moveTo(splineVector[0].x, splineVector[0].y);
          context.lineTo(
            splineVector[splineVector.length - 1].x,
            splineVector[splineVector.length - 1].y
          );
        }
        context.stroke();
        context.strokeStyle = isActive ? mainColor : color;
      }
    }

    // Draw all points
    context.beginPath();
    splineVector.forEach(({ x, y }, i) => {
      if (!isActive && cubic && i % 3 !== 0) return;

      if (this.selectedPointIndex === i && isActive) {
        context.fillRect(
          x - pointSize / 2,
          y - pointSize / 2,
          pointSize,
          pointSize
        ); // draw a filled square to mark the point as selected
      } else {
        context.rect(
          x - pointSize / 2,
          y - pointSize / 2,
          pointSize,
          pointSize
        ); // draw a square to mark the point
      }
    });
    context.stroke();
  };

  drawAllSplines = (): void => {
    // Draw all the splines
    if (!this.baseCanvas) return;

    // Clear all the splines:
    const { canvasContext: context } = this.baseCanvas;
    const activeAnnotationID =
      this.props.annotationsObject.getActiveAnnotationID();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw all the splines:
    this.props.annotationsObject
      .getAllSplines(this.props.sliceIndex)
      .forEach(([spline, i]) => {
        this.drawSplineVector(
          spline,
          i === activeAnnotationID,
          getRGBAString(palette[i % palette.length])
        );
      });
  };

  private deselectPoint = () => {
    this.selectedPointIndex = -1;
    this.drawAllSplines();
  };

  deleteSelectedPoint = (): void => {
    if (this.selectedPointIndex === -1 || !this.sliceIndexMatch()) return;

    // Delete x,y point at selected index
    this.props.annotationsObject.deleteSplinePoint(this.selectedPointIndex);

    // decrement selectedPointIndex, unless it's already 0:
    this.selectedPointIndex = Math.max(0, this.selectedPointIndex - 1);

    if (this.props.annotationsObject.getSplineCoordinates().length < 3) {
      this.props.annotationsObject.setSplineClosed(false);
    }

    this.drawAllSplines();
  };

  clickNearPoint = (clickPoint: XYPoint, splineVector: XYPoint[]): number => {
    // iterates through the points of splineVector, returns the index of the closest point within distance 16 of clickPoint
    // clickPoint and splineVector are both expected to be in image space
    // returns -1 if no point was within distance 16

    const { x: clickPointX, y: clickPointY } = imageToCanvas(
      clickPoint.x,
      clickPoint.y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.state.canvasPositionAndSize
    );

    let minDist = 9999999;
    let minDistIdx = -1;
    for (let i = 0; i < splineVector.length; i += 1) {
      // transform points into canvas space so the nudge radius won't depend on zoom level:
      let point = splineVector[i];
      point = imageToCanvas(
        point.x,
        point.y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.state.canvasPositionAndSize
      );

      const distanceToPoint = Math.sqrt(
        (point.x - clickPointX) ** 2 + (point.y - clickPointY) ** 2
      );

      if (distanceToPoint < 16 && distanceToPoint < minDist) {
        minDist = distanceToPoint;
        minDistIdx = i;
      }
    }

    return minDistIdx;
  };

  onClick = (x: number, y: number, isCTRL?: boolean): void => {
    // handle click to select an annotation (Mode.select)
    // or add new point to a normal spline (Mode.draw and this.props.activeToolbox === "Spline")
    // or add TL or BR point to a rectangle spline (Mode.draw and this.props.activeToolbox === Tools.rectspline.name)

    let coordinates = this.props.annotationsObject.getSplineCoordinates();

    if (this.isDrawing || this.dragPoint) {
      // turns out onClick still runs when releasing a drag, so we want to abort in that case:
      this.isDrawing = false;
      this.dragPoint = null;

      if (
        !(
          this.selectedPointIndex === coordinates.length - 1 &&
          this.dragPoint !== coordinates[coordinates.length - 1]
        )
      )
        // But if the selected point is the last point in the spline, and we've not actually moved it,
        // then don't abort onClick - the user is trying to add a point near the end of the spline.
        return;
    }

    // X and Y are in CanvasSpace, convert to ImageSpace
    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.state.canvasPositionAndSize
    );

    if (this.props.mode === Mode.select) {
      // In select mode a single click allows to select a different spline annotation
      const selectedAnnotationID = this.props.annotationsObject.clickSelect(
        imageX,
        imageY,
        this.props.sliceIndex,
        this.props.setUIActiveAnnotationID,
        this.props.setActiveToolbox
      );

      if (selectedAnnotationID !== null) {
        this.props.setMode(Mode.draw);
      }
    }

    // if no spline tool is turned on then do nothing
    if (!this.isActive()) return;

    if (this.sliceIndexMatch()) {
      if (isCTRL) {
        this.onCTRLClick(x, y);
      } else if (
        this.props.mode === Mode.draw &&
        !this.props.annotationsObject.splineIsClosed() &&
        ["Spline", "Bezier Spline"].includes(this.props.activeToolbox) &&
        JSON.stringify({ x: imageX, y: imageY }) !==
          JSON.stringify(coordinates[coordinates.length - 1]) // don't allow duplicate points
      ) {
        const cubic = this.props.annotationsObject.splineIsBezier();
        if (cubic && coordinates.length > 0) {
          // add three points (second control point for the current terminal point, first control point for the new terminal point, and the new terminal point):
          const newPoint = { x: imageX, y: imageY };
          const prevPoint = coordinates[coordinates.length - 1];

          // add the current terminal point's second control point 25% the way to the new point if we're adding the second point in the curve:
          const newControlPoint = {
            x: 0.75 * prevPoint.x + 0.25 * newPoint.x,
            y: 0.75 * prevPoint.y + 0.25 * newPoint.y,
          };
          this.props.annotationsObject.addSplinePoint(newControlPoint);

          // add the new point's first control point, 25% along the line to the newly added control point:
          this.props.annotationsObject.addSplinePoint({
            x: 0.25 * newControlPoint.x + 0.75 * newPoint.x,
            y: 0.25 * newControlPoint.y + 0.75 * newPoint.y,
          });

          // add the new point:
          this.props.annotationsObject.addSplinePoint(newPoint);

          // make the curve smooth:
          coordinates = this.props.annotationsObject.getSplineCoordinates();
          const i = coordinates.length - 4;
          if (i >= 3) {
            const norm = (point: XYPoint) =>
              Math.sqrt(point.x ** 2 + point.y ** 2);

            // a: previous point
            // b: this point
            // c: next point
            const ab = {
              x: coordinates[i].x - coordinates[i - 3].x,
              y: coordinates[i].y - coordinates[i - 3].y,
            };
            const bc = {
              x: coordinates[i + 3].x - coordinates[i].x,
              y: coordinates[i + 3].y - coordinates[i].y,
            };
            const ac = {
              x: coordinates[i + 3].x - coordinates[i - 3].x,
              y: coordinates[i + 3].y - coordinates[i - 3].y,
            };

            this.props.annotationsObject.updateSplinePoint(
              coordinates[i].x - (ac.x * norm(ab) * 0.3) / norm(ac),
              coordinates[i].y - (ac.y * norm(ab) * 0.3) / norm(ac),
              i - 1
            );
            this.props.annotationsObject.updateSplinePoint(
              coordinates[i].x + (ac.x * norm(bc) * 0.3) / norm(ac),
              coordinates[i].y + (ac.y * norm(bc) * 0.3) / norm(ac),
              i + 1
            );
          }
        } else {
          // if a normal spline, just add points as needed
          this.props.annotationsObject.addSplinePoint({
            x: imageX,
            y: imageY,
          });
          this.selectedPointIndex =
            this.props.annotationsObject.getSplineLength() - 1;
        }
      }
    }

    this.drawAllSplines();
  };

  onCTRLClick = (x: number, y: number): void => {
    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.state.canvasPositionAndSize
    );
    this.addNewPointNearSpline(imageX, imageY);
  };

  closeSpline = (): void => {
    // Append the first spline point to the end, making a closed polygon

    // check the current annotation is on the current slice
    if (!this.sliceIndexMatch()) return;

    let coordinates = this.props.annotationsObject.getSplineCoordinates();
    if (coordinates.length < 3) {
      return; // need at least three points to make a closed polygon
    }

    this.props.annotationsObject.setSplineClosed(true);

    const cubic = this.props.annotationsObject.splineIsBezier();
    if (cubic) {
      // need to add a couple of control points:
      this.props.annotationsObject.addSplinePoint({
        x: coordinates[coordinates.length - 1].x,
        y: coordinates[coordinates.length - 1].y,
      });
      this.props.annotationsObject.addSplinePoint({
        x: coordinates[0].x,
        y: coordinates[0].y,
      });

      // smooth the curve at final control point:
      coordinates = this.props.annotationsObject.getSplineCoordinates();
      const norm = (point: XYPoint) => Math.sqrt(point.x ** 2 + point.y ** 2);
      // a: previous point
      // b: this point
      // c: next point
      const final = coordinates.length - 3;
      let ab = {
        x: coordinates[final].x - coordinates[final - 3].x,
        y: coordinates[final].y - coordinates[final - 3].y,
      };
      let bc = {
        x: coordinates[0].x - coordinates[final].x,
        y: coordinates[0].y - coordinates[final].y,
      };
      let ac = {
        x: coordinates[0].x - coordinates[final - 3].x,
        y: coordinates[0].y - coordinates[final - 3].y,
      };

      this.props.annotationsObject.updateSplinePoint(
        coordinates[final].x - (ac.x * norm(ab) * 0.3) / norm(ac),
        coordinates[final].y - (ac.y * norm(ab) * 0.3) / norm(ac),
        final - 1
      );
      this.props.annotationsObject.updateSplinePoint(
        coordinates[final].x + (ac.x * norm(bc) * 0.3) / norm(ac),
        coordinates[final].y + (ac.y * norm(bc) * 0.3) / norm(ac),
        final + 1
      );

      // smooth the curve at first control point:
      ab = {
        x: coordinates[0].x - coordinates[final].x,
        y: coordinates[0].y - coordinates[final].y,
      };
      bc = {
        x: coordinates[3].x - coordinates[0].x,
        y: coordinates[3].y - coordinates[0].y,
      };
      ac = {
        x: coordinates[3].x - coordinates[final].x,
        y: coordinates[3].y - coordinates[final].y,
      };

      this.props.annotationsObject.updateSplinePoint(
        coordinates[0].x - (ac.x * norm(ab) * 0.3) / norm(ac),
        coordinates[0].y - (ac.y * norm(ab) * 0.3) / norm(ac),
        coordinates.length - 1
      );
      this.props.annotationsObject.updateSplinePoint(
        coordinates[0].x + (ac.x * norm(bc) * 0.3) / norm(ac),
        coordinates[0].y + (ac.y * norm(bc) * 0.3) / norm(ac),
        1
      );
    }

    this.drawAllSplines();
  };

  convertSpline = (): boolean => {
    // Create a new paintbrush annotation that is equivalent to closing the current spline shape
    // Returns true if successful, false otherwise

    if (
      (this.props.activeToolbox !== "Spline" &&
        this.props.activeToolbox !== "Lasso Spline" &&
        this.props.activeToolbox !== "Magic Spline") ||
      this.props.annotationsObject.getSplineCoordinates().length === 0
    )
      return false;

    // check the current annotation is on the current slice
    if (!this.sliceIndexMatch()) return false;

    // convert to paintbrush annotation with diameter=1 pixel
    // TODO determine radius more cleverly
    this.props.annotationsObject.convertSplineToPaintbrush(0.5);

    // set the active tool to be the paintbrush
    document.dispatchEvent(
      new CustomEvent("selectBrush", { detail: Toolboxes.paintbrush })
    );

    this.drawAllSplines();

    return true;
  };

  fillSpline = (): void => {
    // Create a new paintbrush annotation that is equivalent to closing and filling the current spline shape

    if (this.convertSpline()) {
      // call the fill paintbrush function
      document.dispatchEvent(
        new CustomEvent("fillBrush", { detail: Toolboxes.paintbrush })
      );
    }
  };

  makeBezier = (): void => {
    this.props.annotationsObject.setSplineBezier(
      !this.props.annotationsObject.splineIsBezier()
    );

    // trim points to 3n + 1:
    const coordinates = this.props.annotationsObject.getSplineCoordinates();
    if (this.props.annotationsObject.splineIsClosed()) {
      const pointsToDelete = coordinates.length % 3;
      if (pointsToDelete !== 0) {
        for (let i = 0; i < pointsToDelete; i += 1) {
          this.props.annotationsObject.deleteSplinePoint(
            coordinates.length - 1 - i
          );
        }
      }
    } else {
      const pointsToDelete = (coordinates.length - 1) % 3;
      for (let i = 0; i < pointsToDelete; i += 1) {
        this.props.annotationsObject.deleteSplinePoint(
          coordinates.length - 1 - i
        );
      }
    }

    this.drawAllSplines();
  };

  snapToGradient = (idx: number, snapeRadius = 25): void => {
    // snaps point #idx in the current active spline to the maximum gradient point within snapeRadius
    if (this.gradientImage === undefined) return;
    const coordinates = this.props.annotationsObject.getSplineCoordinates();

    if (coordinates.length === 0) return;
    const point = coordinates[idx];

    const xMin = Math.floor(Math.max(0, point.x - snapeRadius));
    const xMax = Math.floor(
      Math.min(this.props.displayedImage.width - 1, point.x + snapeRadius)
    );
    const yMin = Math.floor(Math.max(0, point.y - snapeRadius));
    const yMax = Math.floor(
      Math.min(this.props.displayedImage.height - 1, point.y + snapeRadius)
    );

    // search within snapeRadius for the maximum (gradient : distance)
    let bestVal = 0;
    let bestX = Math.floor(point.x);
    let bestY = Math.floor(point.y);
    let val;
    let forward = 0;
    let parallel;
    if (idx > 1) {
      // if at least two points have already been drawn, get a normalized vector at right angles to the line joining the previous two points
      // so we can penalize deviation along that axis:
      parallel = [
        coordinates[idx - 1].x - coordinates[idx - 2].x,
        coordinates[idx - 1].y - coordinates[idx - 2].y,
      ];
    }
    for (let x = xMin; x <= xMax; x += 1) {
      for (let y = yMin; y <= yMax; y += 1) {
        const i = (y * this.gradientImage.width + x) * 4 + 0; // using red channel values since gradientImage is always greyscale
        if (parallel !== undefined) {
          // dot product of (B -> C) with (A -> B)
          // where line is A -> B -> C
          forward =
            (x - coordinates[idx - 1].x) * parallel[0] +
            (y - coordinates[idx - 1].y) * parallel[1];
        }
        // multiplying by sign of forward gives backward-facing points a negative score, so they never win
        // i.e. will never turn more than 90 degrees at once
        const clickDistance = Math.sqrt(
          (x - point.x) ** 2 + (y - point.y) ** 2
        ); // distance to where the user clicked
        val =
          (Math.sign(forward) * this.gradientImage.data[i]) /
          (1 + clickDistance);
        if (val > bestVal) {
          bestVal = this.gradientImage.data[i];
          bestX = x;
          bestY = y;
        }
      }
    }
    this.props.annotationsObject.updateSplinePoint(bestX, bestY, idx);
  };

  onMouseDownOrTouchStart = (x: number, y: number): void => {
    if (!this.sliceIndexMatch() || this.props.mode === Mode.select) return;

    const coordinates = this.props.annotationsObject.getSplineCoordinates();

    const clickPoint = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.state.canvasPositionAndSize
    );

    // try and drag and drop existing nodes
    const nearPoint = this.clickNearPoint(clickPoint, coordinates);
    if (nearPoint !== -1) {
      this.selectedPointIndex = nearPoint;
      this.dragPoint = coordinates[nearPoint];
    } else if (
      this.props.activeToolbox === "Magic Spline" &&
      !this.props.annotationsObject.splineIsClosed()
    ) {
      // magic spline, add a new point and snap it to the highest gradient point within 25 pixels:
      if (this.gradientImage === undefined) {
        this.gradientImage = calculateSobel(this.props.displayedImage);
      }
      this.props.annotationsObject.addSplinePoint(clickPoint);
      this.snapToGradient(this.props.annotationsObject.getSplineLength() - 1);
      this.isDrawing = true;
    } else if (
      this.props.activeToolbox === "Lasso Spline" &&
      !this.props.annotationsObject.splineIsClosed()
    ) {
      // lasso spline, add a new point but no snapping
      this.props.annotationsObject.addSplinePoint(clickPoint);
      this.selectedPointIndex =
        this.props.annotationsObject.getSplineLength() - 1;
      this.isDrawing = true;
    }

    this.drawAllSplines();
  };

  onMouseMoveOrTouchMove = (x: number, y: number): void => {
    if (!(this.isDrawing || this.dragPoint)) return;

    this.numberOfMoves += 1;

    // Replace update the coordinates for the point dragged
    const clickPoint = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.state.canvasPositionAndSize
    );

    if (
      this.props.activeToolbox === "Magic Spline" &&
      this.numberOfMoves % 5 === 0 &&
      this.isDrawing
    ) {
      // magic spline, every 5 moves add a new point
      // and snap it to the highest gradient point within 25 pixels:
      this.props.annotationsObject.addSplinePoint({
        x: clickPoint.x,
        y: clickPoint.y,
      });
      this.snapToGradient(
        this.props.annotationsObject.getSplineLength() - 1,
        25 / this.props.scaleAndPan.scale
      );
    } else if (
      this.props.activeToolbox === "Lasso Spline" &&
      this.numberOfMoves % 5 === 0 &&
      this.isDrawing
    ) {
      // lasso spline, every 5 moves add a new point
      this.props.annotationsObject.addSplinePoint({
        x: clickPoint.x,
        y: clickPoint.y,
      });
      this.selectedPointIndex =
        this.props.annotationsObject.getSplineLength() - 1;
    } else {
      // dragging a point on a normal spline
      this.dragPoint = clickPoint;
    }

    // Redraw all the splines
    this.drawAllSplines();
  };

  onMouseUpOrTouchEnd = (): void => {
    // Works as part of drag and drop for points.
    if (this.dragPoint) {
      this.props.annotationsObject.updateSplinePoint(
        this.dragPoint.x,
        this.dragPoint.y,
        this.selectedPointIndex
      );
    }
    // we set this.isMouseDown = false in onClick
    // onMouseUp runs before onClick, so if we set it here then onClick wouldn't know to abort
  };

  private addNewPointNearSpline = (x: number, y: number): void => {
    // Add a new point near the spline.
    const coordinates = this.props.annotationsObject.getSplineCoordinates();
    if (this.props.annotationsObject.splineIsClosed()) {
      coordinates.push(coordinates[0]); // add the closing edge if the spline is closed
    }

    const dist = (x1: number, y1: number, x2: number, y2: number): number =>
      // Calculate Euclidean distance between two points (x1, y1) and (x2, y2).
      Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    let newPointIndex: number; // Index at which the new point is inserted
    let minDist = Number.MAX_VALUE; // Minimum distance
    for (let i = 1; i < coordinates.length; i += 1) {
      // For each pair of consecutive points
      const prevPoint = coordinates[i - 1];
      const nextPoint = coordinates[i];
      // Calculate the euclidean distance from the new point
      const newDist =
        dist(x, y, prevPoint.x, prevPoint.y) +
        dist(x, y, nextPoint.x, nextPoint.y) -
        dist(prevPoint.x, prevPoint.y, nextPoint.x, nextPoint.y);
      // If the calculated distance is smaller than the min distance so far
      if (newDist < minDist) {
        // Update minimum distance and new point index
        minDist = newDist;
        newPointIndex = i;
      }
    }
    this.props.annotationsObject.insertSplinePoint(newPointIndex, { x, y }); // Add new point to the coordinates array
    this.selectedPointIndex = newPointIndex;
  };

  getCursor = (): Cursor => {
    if (!this.isActive()) return "none";
    return this.props.mode === Mode.draw ? "crosshair" : "pointer";
  };

  isActive = (): boolean =>
    this.props.activeToolbox === "Spline" ||
    this.props.activeToolbox === "Lasso Spline" ||
    this.props.activeToolbox === "Magic Spline" ||
    this.props.activeToolbox === "Bezier Spline";

  sliceIndexMatch = (): boolean =>
    this.props.annotationsObject.getSplineForActiveAnnotation().spaceTimeInfo
      .z === this.props.sliceIndex;

  setCanvasPositionAndSize = (
    newCanvasPositionAndSize: PositionAndSize
  ): void => {
    this.setState((prevState: State) => {
      const { canvasPositionAndSize } = prevState;
      return {
        canvasPositionAndSize: {
          top: newCanvasPositionAndSize.top || canvasPositionAndSize.top,
          left: newCanvasPositionAndSize.left || canvasPositionAndSize.left,
          width: newCanvasPositionAndSize.width || canvasPositionAndSize.width,
          height:
            newCanvasPositionAndSize.height || canvasPositionAndSize.height,
        },
      };
    });
  };

  render = (): ReactNode =>
    this.props?.displayedImage ? (
      <div style={{ pointerEvents: this.isActive() ? "auto" : "none" }}>
        <BaseCanvas
          onClick={this.onClick}
          onMouseDown={this.onMouseDownOrTouchStart}
          onTouchStart={this.onMouseDownOrTouchStart}
          onMouseMove={this.onMouseMoveOrTouchMove}
          onTouchMove={this.onMouseMoveOrTouchMove}
          onMouseUp={this.onMouseUpOrTouchEnd}
          onTouchEnd={this.onMouseUpOrTouchEnd}
          cursor={this.getCursor()}
          ref={(baseCanvas) => {
            if (baseCanvas) {
              this.baseCanvas = baseCanvas;
            }
          }}
          name={this.name}
          scaleAndPan={this.props.scaleAndPan}
          canvasPositionAndSize={this.state.canvasPositionAndSize}
          setCanvasPositionAndSize={this.setCanvasPositionAndSize}
        />
      </div>
    ) : null;
}

export const Canvas = (props: Props): ReactElement => {
  // we will overwrite props.activeToolbox, which will be spline
  // with spline.splineType, which will be spline/lasso/magic/rect
  const [spline] = useSplineStore();
  let { activeToolbox } = props;
  if (activeToolbox === Toolboxes.spline) {
    activeToolbox = spline.splineType;
  }

  return (
    <CanvasClass
      activeToolbox={activeToolbox}
      mode={props.mode}
      setMode={props.setMode}
      annotationsObject={props.annotationsObject}
      displayedImage={props.displayedImage}
      scaleAndPan={props.scaleAndPan}
      redraw={props.redraw}
      sliceIndex={props.sliceIndex}
      setUIActiveAnnotationID={props.setUIActiveAnnotationID}
      setActiveToolbox={props.setActiveToolbox}
    />
  );
};

function evaluateBezier(): void {
  const coordinates = this.props.annotationsObject.getSplineCoordinates();
  this.props.annotationsObject.addAnnotation("spline");
  for (let i = 0; i < coordinates.length - 3; i += 3) {
    for (let t = 0; t <= 1; t += 0.01) {
      // lerp between p0 and p1, p1 and p2, and p2 and p3:
      const a0x = (1 - t) * coordinates[i].x + t * coordinates[i + 1].x;
      const a0y = (1 - t) * coordinates[i].y + t * coordinates[i + 1].y;

      const a1x = (1 - t) * coordinates[i + 1].x + t * coordinates[i + 2].x;
      const a1y = (1 - t) * coordinates[i + 1].y + t * coordinates[i + 2].y;

      const a2x = (1 - t) * coordinates[i + 2].x + t * coordinates[i + 3].x;
      const a2y = (1 - t) * coordinates[i + 2].y + t * coordinates[i + 3].y;

      // lerp between l0 and l1, and l1 and l2:
      const b0x = (1 - t) * a0x + t * a1x;
      const b0y = (1 - t) * a0y + t * a1y;

      const b1x = (1 - t) * a1x + t * a2x;
      const b1y = (1 - t) * a1y + t * a2y;

      // lerp between b0 and b1:
      const cx = (1 - t) * b0x + t * b1x;
      const cy = (1 - t) * b0y + t * b1y;

      this.props.annotationsObject.addSplinePoint({ x: cx, y: cy });
    }
  }
}

export { evaluateBezier };
