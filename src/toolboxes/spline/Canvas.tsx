import React, { ReactNode, Component } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { Annotations } from "@/annotation";
import { canvasToImage, imageToCanvas } from "@/transforms";
import { Annotation, XYPoint } from "@/annotation/interfaces";

import {
  main as mainColor,
  secondary as secondaryColor,
  getRGBAString,
  palette,
} from "@/palette";

import { calculateSobel } from "./sobel";

interface Props extends BaseProps {
  activeTool: string;
  annotationsObject: Annotations;
  callRedraw: number;
  sliceIndex: number;
}
enum Mode {
  draw,
  magic,
  select,
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = [
  "deleteSelectedPoint",
  "changeSplineModeToEdit",
  "deselectPoint",
  "closeLoop",
  "toggleMode",
] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";
interface State {
  isActive: boolean;
  mode: Mode;
}

export class SplineCanvas extends Component<Props, State> {
  readonly name = "spline";

  private baseCanvas: BaseCanvas;

  private selectedPointIndex: number;

  private isDragging: boolean;

  private gradientImage: ImageData;

  private numberOfMoves: number; // increments on mouse move; used to space out the magic spline points

  constructor(props: Props) {
    super(props);
    this.selectedPointIndex = -1;
    this.isDragging = false;
    this.numberOfMoves = 0;
    this.state = { mode: Mode.draw, isActive: false };
  }

  componentDidMount(): void {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // Redraw if we change pan or zoom
    const spline = this.props.annotationsObject.getSplineForActiveAnnotation();

    // Change mode if we change the spline type prop
    if (this.props.activeTool !== prevProps.activeTool) {
      this.updateMode();
    }

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
      context.strokeStyle = getRGBAString(mainColor);
    } else {
      context.strokeStyle = color;
    }
    // Squares
    context.fillStyle = getRGBAString(secondaryColor);

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

    // Clear all the splines:
    const { canvasContext: context } = this.baseCanvas;
    const activeAnnotationID =
      this.props.annotationsObject.getActiveAnnotationID();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw all the splines:
    this.props.annotationsObject
      .getAllAnnotations()
      .forEach((annotation: Annotation, i: number) => {
        if (
          annotation.spline.spaceTimeInfo.z === this.props.sliceIndex &&
          (annotation.toolbox === "spline" ||
            annotation.toolbox === "magicspline")
        ) {
          this.drawSplineVector(
            annotation.spline.coordinates,
            i === activeAnnotationID,
            getRGBAString(palette[i % palette.length])
          );
        }
      });
  };

  private changeSplineModeToEdit = (): void => {
    // TODO: add keyboard shortcuts for switching between modes
    this.setState({ mode: Mode.select }); // Change mode to select mode
    this.deselectPoint();
  };

  public changeSplineModeToMagic = (): void => {
    // TODO: add keyboard shortcuts for switching between modes
    this.setState({ mode: Mode.magic });
    // TODO this.calculateGradientImage();
  };

  private deselectPoint = () => {
    this.selectedPointIndex = -1;
    this.drawAllSplines();
  };

  deleteSelectedPoint = (): void => {
    if (this.selectedPointIndex === -1 || !this.sliceIndexMatch()) return;

    const { coordinates } =
      this.props.annotationsObject.getSplineForActiveAnnotation();
    const isClosed = this.isClosed(coordinates);

    // If close spline
    if (isClosed) {
      // If selected index is last index, change selected index to first index
      if (this.selectedPointIndex === coordinates.length - 1) {
        this.selectedPointIndex = 0;
      }

      // Delete x,y point at selected index
      coordinates.splice(this.selectedPointIndex, 1);

      // If selected index is first index, delete also point at last index
      if (this.selectedPointIndex === 0) {
        if (coordinates.length === 1) {
          this.props.annotationsObject.setSplineCoordinates([]);
        } else {
          this.updateXYPoint(
            coordinates[0].x,
            coordinates[0].y,
            coordinates.length - 1
          );
        }
      }
    } else {
      // Delete x,y point at selected index
      coordinates.splice(this.selectedPointIndex, 1);
    }
    if (coordinates.length === 0) {
      this.setState({ mode: Mode.draw });
    }

    this.selectedPointIndex -= 1;
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

  // X and Y are in CanvasSpace
  onClick = (x: number, y: number): void => {
    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.sliceIndexMatch()) {
      const { coordinates } =
        this.props.annotationsObject.getSplineForActiveAnnotation();

      // check if we clicked within the nudge radius of an existing point:
      const nudgePointIdx = this.clickNearPoint(
        { x: imageX, y: imageY },
        coordinates
      );
      const isClosed = this.isClosed(coordinates);

      if (nudgePointIdx !== -1) {
        // If the mouse click was near an existing point, nudge that point
        const nudgePoint = coordinates[nudgePointIdx];

        this.updateXYPoint(
          (nudgePoint.x + imageX) / 2,
          (nudgePoint.y + imageY) / 2,
          nudgePointIdx
        );

        if (nudgePointIdx === 0 && isClosed) {
          // need to update the final point as well if we're nudging the first point of a closed spline,
          // or else the loop gets broken
          this.updateXYPoint(
            (nudgePoint.x + imageX) / 2,
            (nudgePoint.y + imageY) / 2,
            coordinates.length - 1
          );
        }

        // If the spline is not closed, append a new point
      } else if (this.state.mode === Mode.draw && !isClosed) {
        // Add coordinates to the current spline
        coordinates.push({ x: imageX, y: imageY });
        this.selectedPointIndex = coordinates.length - 1;
      }
    }

    if (this.state.mode === Mode.select) {
      // In select mode a single click allows to select a different spline
      const selectedSpline = this.clickNearSpline(imageX, imageY);
      if (selectedSpline !== null) {
        this.props.annotationsObject.setActiveAnnotationID(selectedSpline);
      }
    }

    this.drawAllSplines();
  };

  clickNearSpline = (imageX: number, imageY: number): number => {
    // Check if point clicked (in image space) is near an existing spline.
    // If true, return annotation index, otherwise return null.
    const annotations = this.props.annotationsObject.getAllAnnotations();

    for (let i = 0; i < annotations.length; i += 1) {
      if (
        annotations[i].spline.spaceTimeInfo.z === this.props.sliceIndex &&
        annotations[i].toolbox === "spline"
      ) {
        const { spline } = annotations[i];
        // For each pair of points, check is point clicked is near the line segment
        // having for end points two consecutive points in the spline.
        for (let j = 1; j < spline.coordinates.length; j += 1) {
          if (
            this.isClickNearLineSegment(
              { x: imageX, y: imageY },
              spline.coordinates[j - 1],
              spline.coordinates[j]
            )
          )
            return i;
        }
      }
    }
    return null;
  };

  isClickNearLineSegment = (
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

  onDoubleClick = (x: number, y: number): void => {
    // Add new point on double-click.
    if (this.state.mode === Mode.draw || !this.sliceIndexMatch()) return;

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

  updateXYPoint = (newX: number, newY: number, index: number): void => {
    const { coordinates } =
      this.props.annotationsObject.getSplineForActiveAnnotation();
    coordinates[index] = { x: newX, y: newY };
  };

  closeLoop = (): void => {
    // Append the first spline point to the end, making a closed polygon
    if (!this.sliceIndexMatch()) return;

    const { coordinates } =
      this.props.annotationsObject.getSplineForActiveAnnotation();
    if (coordinates.length < 3) {
      return; // need at least three points to make a closed polygon
    }

    if (this.isClosed(coordinates)) {
      return; // don't duplicate the first point again if the loop is already closed
    }

    coordinates.push(coordinates[0]);

    this.drawAllSplines();
  };

  snapToGradient = (idx: number, snapeRadius = 25): void => {
    // snaps point #idx in the current active spline to the maximum gradient point within snapeRadius
    if (this.gradientImage === undefined) return;
    const { coordinates } =
      this.props.annotationsObject.getSplineForActiveAnnotation();

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
    this.updateXYPoint(bestX, bestY, idx);
  };

  onMouseDown = (x: number, y: number): void => {
    if (!this.sliceIndexMatch()) return;

    const { coordinates } =
      this.props.annotationsObject.getSplineForActiveAnnotation();

    const clickPoint = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.state.mode === Mode.magic) {
      // add a new point and snap it to the highest gradient point within 25 pixels:
      if (this.gradientImage === undefined) {
        this.gradientImage = calculateSobel(this.props.displayedImage);
      }
      coordinates.push(clickPoint);
      this.snapToGradient(coordinates.length - 1);
      this.isDragging = true;
      this.drawAllSplines();
    } else {
      const nearPoint = this.clickNearPoint(clickPoint, coordinates);
      if (nearPoint !== -1) {
        this.selectedPointIndex = nearPoint;
        this.isDragging = true;
      }
    }
  };

  onMouseMove = (x: number, y: number): void => {
    if (!this.isDragging) return;

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

    const { coordinates } =
      this.props.annotationsObject.getSplineForActiveAnnotation();

    if (this.state.mode === Mode.magic && this.numberOfMoves % 5 === 0) {
      // add a new point and snap it to the highest gradient point within 25 pixels:
      coordinates.push({ x: clickPoint.x, y: clickPoint.y });
      this.snapToGradient(
        coordinates.length - 1,
        25 / this.props.scaleAndPan.scale
      );
    } else {
      // If dragging first point, update also last
      if (this.selectedPointIndex === 0 && this.isClosed(coordinates)) {
        this.updateXYPoint(clickPoint.x, clickPoint.y, coordinates.length - 1);
      }

      this.updateXYPoint(clickPoint.x, clickPoint.y, this.selectedPointIndex);
    }

    // Redraw all the splines
    this.drawAllSplines();
  };

  onMouseUp = (): void => {
    // Works as part of drag and drop for points.
    this.isDragging = false;
  };

  isClosed = (splineVector: XYPoint[]): boolean =>
    // Check whether the spline is a closed loop.
    splineVector.length > 1 &&
    splineVector[0].x === splineVector[splineVector.length - 1].x &&
    splineVector[0].y === splineVector[splineVector.length - 1].y;

  private addNewPointNearSpline = (x: number, y: number): void => {
    // Add a new point near the spline.
    const { coordinates } =
      this.props.annotationsObject.getSplineForActiveAnnotation();

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
    coordinates.splice(newPointIndex, 0, { x, y }); // Add new point to the coordinates array
    this.props.annotationsObject.setSplineCoordinates(coordinates); // Save new coordinates inside active annotation
  };

  getCursor = (): Cursor => {
    if (!this.isActive()) return "none";
    return this.state.mode === Mode.draw ? "crosshair" : "pointer";
  };

  isActive = (): boolean =>
    this.props.activeTool === "spline" ||
    this.props.activeTool === "magicspline";

  sliceIndexMatch = (): boolean =>
    this.props.annotationsObject.getSplineForActiveAnnotation().spaceTimeInfo
      .z === this.props.sliceIndex;

  toggleMode = (): void => {
    if (!this.isActive()) return;
    if (this.state.mode === Mode.draw) {
      this.setState({ mode: Mode.select });
    } else {
      this.setState({ mode: Mode.draw });
    }
  };

  private updateMode(): void {
    // FIXME this is a bit clumsy
    // Change mode if we change the spline type prop
    switch (this.props.activeTool) {
      case "spline": {
        this.setState({ mode: Mode.draw, isActive: true });
        break;
      }
      case "magicspline": {
        this.setState({ mode: Mode.magic, isActive: true });
        break;
      }
      default: {
        this.setState({ mode: Mode.draw, isActive: false });
        break;
      }
    }
  }

  render = (): ReactNode => (
    <div style={{ pointerEvents: this.state.isActive ? "auto" : "none" }}>
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
  );
}
