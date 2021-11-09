import { ReactNode, Component, ReactElement } from "react";
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
] as const;

const mainColor = theme.palette.primary.main;
const secondaryColor = theme.palette.secondary.main;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";

class CanvasClass extends Component<Props, State> {
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
    const splineVector = spline.coordinates;

    if (splineVector.length === 0) return;

    const { canvasContext: context } = this.baseCanvas;
    const lineWidth = isActive ? 2 : 1;
    context.lineWidth = lineWidth;

    if (isActive) {
      // Lines
      context.strokeStyle = mainColor;
    } else {
      context.strokeStyle = color;
    }
    // Squares
    context.fillStyle = secondaryColor;

    const pointSize = 6;
    let nextPoint;

    if (splineVector.length > 1) {
      // Go to the first point
      let firstPoint: XYPoint;
      if (isActive && this.selectedPointIndex === 0 && this.dragPoint) {
        firstPoint = this.dragPoint;
      } else {
        firstPoint = splineVector[0]; // eslint-disable-line prefer-destructuring
      }

      firstPoint = imageToCanvas(
        firstPoint.x,
        firstPoint.y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.state.canvasPositionAndSize
      );

      context.beginPath();
      context.moveTo(firstPoint.x, firstPoint.y);

      // Draw each point by taking our raw coordinates and applying the transform so they fit on our canvas
      for (const [idx, { x, y }] of splineVector.entries()) {
        let drawPoint: XYPoint;
        if (isActive && this.dragPoint && idx === this.selectedPointIndex) {
          // draw the point at the current mouse position if we're dragging it:
          drawPoint = this.dragPoint;
        } else {
          drawPoint = { x, y };
        }
        nextPoint = imageToCanvas(
          drawPoint.x,
          drawPoint.y,
          this.props.displayedImage.width,
          this.props.displayedImage.height,
          this.props.scaleAndPan,
          this.state.canvasPositionAndSize
        );
        context.lineTo(nextPoint.x, nextPoint.y);
      }
      if (spline.isClosed) {
        context.lineTo(firstPoint.x, firstPoint.y);
      }
      context.stroke();
    }

    // Draw all points
    context.beginPath();
    splineVector.forEach(({ x, y }, i) => {
      let drawPoint: XYPoint;
      if (isActive && this.dragPoint && i === this.selectedPointIndex) {
        drawPoint = this.dragPoint;
      } else {
        drawPoint = { x, y };
      }
      nextPoint = imageToCanvas(
        drawPoint.x,
        drawPoint.y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.state.canvasPositionAndSize
      );
      if (this.selectedPointIndex === i && isActive) {
        context.fillRect(
          nextPoint.x - pointSize / 2,
          nextPoint.y - pointSize / 2,
          pointSize,
          pointSize
        ); // draw a filled square to mark the point as selected
      } else {
        context.rect(
          nextPoint.x - pointSize / 2,
          nextPoint.y - pointSize / 2,
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
    // iterates through the points of splineVector, returns the index of the first point within distance 25 of clickPoint
    // clickPoint and splineVector are both expected to be in image space
    // returns -1 if no point was within distance 25

    const { x: clickPointX, y: clickPointY } = imageToCanvas(
      clickPoint.x,
      clickPoint.y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.state.canvasPositionAndSize
    );

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

      if (distanceToPoint < 25) return i;
    }

    return -1;
  };

  onClick = (x: number, y: number, isCTRL?: boolean): void => {
    // handle click to select an annotation (Mode.select)
    // or add new point to a normal spline (Mode.draw and this.props.activeToolbox === "Spline")
    // or add TL or BR point to a rectangle spline (Mode.draw and this.props.activeToolbox === Tools.rectspline.name)

    if (this.isDrawing || this.dragPoint) {
      // turns out onClick still runs when releasing a drag, so we want to abort in that case:
      this.isDrawing = false;
      this.dragPoint = null;
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
      } else {
        // if our current spline annotation object is for the visible slice
        // get the current spline coordinates
        const coordinates = this.props.annotationsObject.getSplineCoordinates();

        // check if we clicked within the nudge radius of an existing point
        const nudgePointIdx = this.clickNearPoint(
          { x: imageX, y: imageY },
          coordinates
        );

        if (nudgePointIdx !== -1) {
          // If the mouse click was near an existing point, nudge that point
          const nudgePoint = coordinates[nudgePointIdx];

          this.props.annotationsObject.updateSplinePoint(
            (nudgePoint.x + imageX) / 2,
            (nudgePoint.y + imageY) / 2,
            nudgePointIdx
          );
        } else if (
          this.props.mode === Mode.draw &&
          !this.props.annotationsObject.splineIsClosed()
        ) {
          // else, i.e. not near an existing point
          // if the spline is not closed and we are in Mode.draw then
          // add coordinates to the current spline
          if (this.props.activeToolbox === "Spline") {
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

    const coordinates = this.props.annotationsObject.getSplineCoordinates();
    if (coordinates.length < 3) {
      return; // need at least three points to make a closed polygon
    }

    this.props.annotationsObject.setSplineClosed(true);

    this.drawAllSplines();
  };

  convertSpline = (): boolean => {
    // Create a new paintbrush annotation that is equivalent to closing the current spline shape
    // Returns true if successful, false otherwise

    if (
      this.props.activeToolbox !== "Spline" &&
      this.props.activeToolbox !== "Lasso Spline" &&
      this.props.activeToolbox !== "Magic Spline"
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
      this.dragPoint = clickPoint;
    } else if (this.props.activeToolbox === "Magic Spline") {
      // magic spline, add a new point and snap it to the highest gradient point within 25 pixels:
      if (this.gradientImage === undefined) {
        this.gradientImage = calculateSobel(this.props.displayedImage);
      }
      this.props.annotationsObject.addSplinePoint(clickPoint);
      this.snapToGradient(this.props.annotationsObject.getSplineLength() - 1);
      this.isDrawing = true;
    } else if (this.props.activeToolbox === "Lasso Spline") {
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
    this.props.activeToolbox === "Magic Spline";

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
