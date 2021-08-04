import { ReactNode, Component, ReactElement } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { theme } from "@gliff-ai/style";
import { Annotations } from "@/annotation";
import { canvasToImage, imageToCanvas } from "@/components/transforms";
import { XYPoint } from "@/annotation/interfaces";
import { Tool, Tools } from "@/components/tools";
import { tooltips } from "@/components/tooltips";
import { Mode } from "@/ui";

import { getRGBAString, palette } from "@/components/palette";

import { calculateSobel } from "./sobel";
import { useSplineStore } from "./Store";

interface Props extends BaseProps {
  activeTool: string;
  mode: Mode;
  annotationsObject: Annotations;
  redraw: number;
  sliceIndex: number;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveTool: (tool: Tool) => void;
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = [
  "deleteSelectedPoint",
  "deselectPoint",
  "closeSpline",
  "fillSpline",
] as const;

const mainColor = theme.palette.primary.main;
const secondaryColor = theme.palette.secondary.main;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";

class CanvasClass extends Component<Props> {
  readonly name = "spline";

  private baseCanvas: BaseCanvas;

  private selectedPointIndex: number;

  private isMouseDown: boolean;

  private gradientImage: ImageData;

  private numberOfMoves: number; // increments on mouse move; used to space out the magic spline points

  constructor(props: Props) {
    super(props);
    this.selectedPointIndex = -1;
    this.isMouseDown = false;
    this.numberOfMoves = 0;
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
    splineVector: XYPoint[],
    isActive = false,
    color: string
  ): void => {
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
      let firstPoint: XYPoint = splineVector[0];
      firstPoint = imageToCanvas(
        firstPoint.x,
        firstPoint.y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      );

      context.beginPath();
      context.moveTo(firstPoint.x, firstPoint.y);

      // Draw each point by taking our raw coordinates and applying the transform so they fit on our canvas
      for (const { x, y } of splineVector) {
        nextPoint = imageToCanvas(
          x,
          y,
          this.props.displayedImage.width,
          this.props.displayedImage.height,
          this.props.scaleAndPan,
          this.props.canvasPositionAndSize
        );
        context.lineTo(nextPoint.x, nextPoint.y);
      }
      context.stroke();
    }

    // Draw all points
    context.beginPath();
    splineVector.forEach(({ x, y }, i) => {
      if (i !== splineVector.length - 1 || !this.isClosed(splineVector)) {
        nextPoint = imageToCanvas(
          x,
          y,
          this.props.displayedImage.width,
          this.props.displayedImage.height,
          this.props.scaleAndPan,
          this.props.canvasPositionAndSize
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
          spline.coordinates,
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

    const coordinates = this.props.annotationsObject.getSplineCoordinates();
    const isClosed = this.isClosed(coordinates);

    // If close spline
    if (isClosed) {
      // If selected index is last index, change selected index to first index
      if (this.selectedPointIndex === coordinates.length - 1) {
        this.selectedPointIndex = 0;
      }

      // Delete x,y point at selected index
      this.props.annotationsObject.deleteSplinePoint(this.selectedPointIndex);

      // If selected index is first index, delete also point at last index
      if (this.selectedPointIndex === 0) {
        if (this.props.annotationsObject.getSplineLength() === 1) {
          this.props.annotationsObject.clearSplineCoordinates();
        } else {
          this.props.annotationsObject.updateSplinePoint(
            coordinates[1].x, // coordinates is outdated here due to deleteSplinePoint; coordinates[1] is therefore coordinates[0] now that we've deleted the previous first point
            coordinates[1].y,
            this.props.annotationsObject.getSplineLength() - 1
          );
        }
      }
    } else {
      // Delete x,y point at selected index
      this.props.annotationsObject.deleteSplinePoint(this.selectedPointIndex);
    }

    this.selectedPointIndex = Math.max(0, this.selectedPointIndex - 1);
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
      this.props.canvasPositionAndSize
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
        this.props.canvasPositionAndSize
      );

      const distanceToPoint = Math.sqrt(
        (point.x - clickPointX) ** 2 + (point.y - clickPointY) ** 2
      );

      if (distanceToPoint < 25) return i;
    }

    return -1;
  };

  onClick = (x: number, y: number): void => {
    // handle click to select an annotation (Mode.select)
    // or add new point to a normal spline (Mode.draw and this.props.activeTool === tooltips.spline.name)
    // or add TL or BR point to a rectangle spline (Mode.draw and this.props.activeTool === tooltips.rectspline.name)

    // X and Y are in CanvasSpace, convert to ImageSpace
    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.props.mode === Mode.select) {
      // In select mode a single click allows to select a different spline annotation
      // DEVNOTE this is currently duplicated in each toolbox!
      const selectedBoundingBox =
        this.props.annotationsObject.clickNearBoundingBox(
          imageX,
          imageY,
          this.props.sliceIndex
        );
      const selectedSpline = this.props.annotationsObject.clickNearSpline(
        imageX,
        imageY,
        this.props.sliceIndex
      );
      const selectedBrushStroke =
        this.props.annotationsObject.clickNearBrushStroke(
          imageX,
          imageY,
          this.props.sliceIndex
        );

      if (selectedSpline !== null) {
        this.props.annotationsObject.setActiveAnnotationID(selectedSpline);
        this.props.setUIActiveAnnotationID(selectedSpline);
        this.props.setActiveTool(Tools.spline);
      } else if (
        selectedBoundingBox !== null &&
        selectedBoundingBox !==
          this.props.annotationsObject.getActiveAnnotationID()
      ) {
        this.props.annotationsObject.setActiveAnnotationID(selectedBoundingBox);
        this.props.setUIActiveAnnotationID(selectedBoundingBox);
        this.props.setActiveTool(Tools.boundingBox);
      } else if (selectedBrushStroke !== null) {
        this.props.annotationsObject.setActiveAnnotationID(selectedBrushStroke);
        this.props.setUIActiveAnnotationID(selectedBrushStroke);
        this.props.setActiveTool(Tools.paintbrush);
      }
    }

    // if no spline tool is turned on then do nothing
    if (!this.isActive()) return;

    if (this.sliceIndexMatch()) {
      // if our current spline annotation object is for the visible slice
      // get the current spline coordinates
      const coordinates = this.props.annotationsObject.getSplineCoordinates();

      // check if we clicked within the nudge radius of an existing point
      const nudgePointIdx = this.clickNearPoint(
        { x: imageX, y: imageY },
        coordinates
      );
      // check if the current spline is a closed one
      const isClosed = this.isClosed(coordinates);

      if (nudgePointIdx !== -1) {
        // If the mouse click was near an existing point, nudge that point
        const nudgePoint = coordinates[nudgePointIdx];

        this.props.annotationsObject.updateSplinePoint(
          (nudgePoint.x + imageX) / 2,
          (nudgePoint.y + imageY) / 2,
          nudgePointIdx
        );

        if (nudgePointIdx === 0 && isClosed) {
          // need to update the final point as well if we're nudging the first point of a closed spline,
          // or else the loop gets broken
          this.props.annotationsObject.updateSplinePoint(
            (nudgePoint.x + imageX) / 2,
            (nudgePoint.y + imageY) / 2,
            coordinates.length - 1
          );
        }
      } else if (this.props.mode === Mode.draw && !isClosed) {
        // else, i.e. not near an existing point
        // if the spline is not closed and we are in Mode.draw then
        // add coordinates to the current spline
        if (this.props.activeTool === tooltips.spline.name) {
          // if a normal spline, just add points as needed
          this.props.annotationsObject.addSplinePoint({ x: imageX, y: imageY });
          this.selectedPointIndex =
            this.props.annotationsObject.getSplineLength() - 1;
        }
      }
    }

    this.drawAllSplines();
  };

  onDoubleClick = (x: number, y: number): void => {
    // Add new point on double-click.
    if (this.props.mode === Mode.draw || !this.sliceIndexMatch()) return;

    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );
    this.addNewPointNearSpline(imageX, imageY);
    this.drawAllSplines();
  };

  closeSpline = (): void => {
    // Append the first spline point to the end, making a closed polygon

    // check the current annotation is on the current slice
    if (!this.sliceIndexMatch()) return;

    const coordinates = this.props.annotationsObject.getSplineCoordinates();
    if (coordinates.length < 3) {
      return; // need at least three points to make a closed polygon
    }

    if (this.isClosed(coordinates)) {
      return; // don't duplicate the first point again if the loop is already closed
    }

    // add an endpoint that is the same as the startpoint
    this.props.annotationsObject.addSplinePoint(coordinates[0]);

    this.drawAllSplines();
  };

  fillSpline = (): void => {
    // Create a new paintbrush annotation that is equivalent to closing and filling the current spline shape

    // check the current annotation is on the current slice
    if (!this.sliceIndexMatch()) return;

    // convert to paintbrush annotation with diameter=1 pixel
    // TODO determine radius more cleverly
    this.props.annotationsObject.convertSplineToPaintbrush(2);

    // call the fill paintbrush function
    document.dispatchEvent(
      new CustomEvent("fillBrush", { detail: "paintbrush" })
    );

    // set the active tool to be the paintbrush
    document.dispatchEvent(
      new CustomEvent("selectBrush", { detail: "paintbrush" })
    );

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

  onMouseDown = (x: number, y: number): void => {
    if (!this.sliceIndexMatch()) return;

    const coordinates = this.props.annotationsObject.getSplineCoordinates();

    const clickPoint = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.props.activeTool === tooltips.magicspline.name) {
      // magic spline, add a new point and snap it to the highest gradient point within 25 pixels:
      if (this.gradientImage === undefined) {
        this.gradientImage = calculateSobel(this.props.displayedImage);
      }
      this.props.annotationsObject.addSplinePoint(clickPoint);
      this.snapToGradient(this.props.annotationsObject.getSplineLength() - 1);
      this.isMouseDown = true;
    } else if (this.props.activeTool === tooltips.lassospline.name) {
      // lasso spline, add a new point but no snapping
      this.props.annotationsObject.addSplinePoint(clickPoint);
      this.selectedPointIndex =
        this.props.annotationsObject.getSplineLength() - 1;
      this.isMouseDown = true;
    } else {
      // normal spline, try and drag and drop existing nodes
      const nearPoint = this.clickNearPoint(clickPoint, coordinates);
      if (nearPoint !== -1) {
        this.selectedPointIndex = nearPoint;
        this.isMouseDown = true;
      }
    }
    this.drawAllSplines();
  };

  onMouseMove = (x: number, y: number): void => {
    if (!this.isMouseDown) return;

    this.numberOfMoves += 1;

    // Replace update the coordinates for the point dragged
    const clickPoint = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    const coordinates = this.props.annotationsObject.getSplineCoordinates();

    if (
      this.props.activeTool === tooltips.magicspline.name &&
      this.numberOfMoves % 5 === 0
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
      this.props.activeTool === tooltips.lassospline.name &&
      this.numberOfMoves % 5 === 0
    ) {
      // lasso spline, every 5 moves add a new point
      this.props.annotationsObject.addSplinePoint({
        x: clickPoint.x,
        y: clickPoint.y,
      });
      this.selectedPointIndex =
        this.props.annotationsObject.getSplineLength() - 1;
    } else {
      // normal spline, if dragging first point, update closed last
      if (this.selectedPointIndex === 0 && this.isClosed(coordinates)) {
        this.props.annotationsObject.updateSplinePoint(
          clickPoint.x,
          clickPoint.y,
          this.props.annotationsObject.getSplineLength() - 1
        );
      }

      this.props.annotationsObject.updateSplinePoint(
        clickPoint.x,
        clickPoint.y,
        this.selectedPointIndex
      );
    }

    // Redraw all the splines
    this.drawAllSplines();
  };

  onMouseUp = (): void => {
    // Works as part of drag and drop for points.
    this.isMouseDown = false;
  };

  isClosed = (splineVector: XYPoint[]): boolean =>
    // Check whether the spline is a closed loop.
    splineVector.length > 1 &&
    splineVector[0].x === splineVector[splineVector.length - 1].x &&
    splineVector[0].y === splineVector[splineVector.length - 1].y;

  private addNewPointNearSpline = (x: number, y: number): void => {
    // Add a new point near the spline.
    const coordinates = this.props.annotationsObject.getSplineCoordinates();

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
        dist(x, y, nextPoint.x, nextPoint.y);
      // If the calculated distance is smaller than the min distance so far
      if (minDist > newDist) {
        // Update minimum distance and new point index
        minDist = newDist;
        newPointIndex = i;
      }
    }
    this.props.annotationsObject.insertSplinePoint(newPointIndex, { x, y }); // Add new point to the coordinates array
  };

  getCursor = (): Cursor => {
    if (!this.isActive()) return "none";
    return this.props.mode === Mode.draw ? "crosshair" : "pointer";
  };

  isActive = (): boolean =>
    this.props.activeTool === tooltips.spline.name ||
    this.props.activeTool === tooltips.lassospline.name ||
    this.props.activeTool === tooltips.magicspline.name;

  sliceIndexMatch = (): boolean =>
    this.props.annotationsObject.getSplineForActiveAnnotation().spaceTimeInfo
      .z === this.props.sliceIndex;

  render = (): ReactNode =>
    this.props?.displayedImage ? (
      <div style={{ pointerEvents: this.isActive() ? "auto" : "none" }}>
        <BaseCanvas
          onClick={this.onClick}
          onDoubleClick={this.onDoubleClick}
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          cursor={this.getCursor()}
          ref={(baseCanvas) => {
            this.baseCanvas = baseCanvas;
          }}
          name="spline"
          scaleAndPan={this.props.scaleAndPan}
          canvasPositionAndSize={this.props.canvasPositionAndSize}
          setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
        />
      </div>
    ) : null;
}

export const Canvas = (props: Props): ReactElement => {
  // we will overwrite props.activeTool, which will be spline
  // with spline.splineType, which will be spline/lasso/magic/rect
  const [spline] = useSplineStore();
  let { activeTool } = props;
  if (activeTool === "spline") {
    activeTool = spline.splineType;
  }

  return (
    <CanvasClass
      activeTool={activeTool}
      mode={props.mode}
      annotationsObject={props.annotationsObject}
      displayedImage={props.displayedImage}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
      redraw={props.redraw}
      sliceIndex={props.sliceIndex}
      setUIActiveAnnotationID={props.setUIActiveAnnotationID}
      setActiveTool={props.setActiveTool}
    />
  );
};
