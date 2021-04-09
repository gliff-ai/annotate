import React, { ReactNode, Component } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { Annotations } from "@/annotation";
import { canvasToImage, imageToCanvas } from "@/transforms";
import { Annotation, XYPoint } from "@/annotation/interfaces";
import { theme } from "@/theme";
import { calculateSobel } from "./sobel";
import ImageFileInfo from "@/ImageFileInfo";

interface Props extends BaseProps {
  splineType: string;
  annotationsObject: Annotations;
  callRedraw: number;
  setUploadedImage: (
    slicesData: Array<ImageData>,
    imageFileInfo: ImageFileInfo
  ) => void;
}
enum Mode {
  draw,
  edit,
  magic,
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = [
  "deleteSelectedPoint",
  "changeSplineModeToEdit",
  "deselectPoint",
  "closeLoop",
] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

interface State {
  mode: number;
  isActive: boolean;
}

export class SplineCanvas extends Component<Props, State> {
  readonly name = "spline";

  private baseCanvas: BaseCanvas;

  private selectedPointIndex: number;

  private isDragging: boolean;

  private mode: number;

  private gradientImage: ImageData;

  constructor(props: Props) {
    super(props);
    this.selectedPointIndex = -1;
    this.isDragging = false;
    this.state = { mode: Mode.draw, isActive: false };
  }

  componentDidMount(): void {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // Redraw if we change pan or zoom
    const activeAnnotation = this.props.annotationsObject.getActiveAnnotation();

    // Change mode if we change the spline type prop
    if (this.props.splineType !== prevProps.splineType) {
      this.updateMode();
    }

    if (activeAnnotation?.coordinates) {
      this.drawAllSplines();
    }
  }

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handleEvent = (event: Event): void => {
    if (event.detail === this.name) {
      this[event.type]?.call(this);
    }
  };

  drawSplineVector = (splineVector: XYPoint[], isActive = false): void => {
    if (splineVector.length === 0) return;

    const { canvasContext: context } = this.baseCanvas;
    const lineWidth = isActive ? 2 : 1;
    context.lineWidth = lineWidth;
    context.strokeStyle = theme.palette.secondary.dark;
    context.fillStyle = theme.palette.primary.dark;
    const pointSize = 6;
    let nextPoint;

    if (splineVector.length > 1) {
      // Go to the first point
      let firstPoint: XYPoint = splineVector[0];
      firstPoint = imageToCanvas(
        firstPoint.x,
        firstPoint.y,
        this.props.imageData.width,
        this.props.imageData.height,
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
          this.props.imageData.width,
          this.props.imageData.height,
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
          this.props.imageData.width,
          this.props.imageData.height,
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
    const activeAnnotationID = this.props.annotationsObject.getActiveAnnotationID();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw all the splines:
    this.props.annotationsObject
      .getAllAnnotations()
      .forEach((annotation: Annotation, i: number) => {
        if (
          annotation.toolbox === "spline" ||
          annotation.toolbox === "magicspline"
        ) {
          this.drawSplineVector(
            annotation.coordinates,
            i === activeAnnotationID
          );
        }
      });
  };

  private changeSplineModeToEdit = (): void => {
    // TODO: add keyboard shortcuts for switching between modes
    this.setState({ mode: Mode.edit });
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
    if (this.selectedPointIndex === -1) return;
    const { coordinates } = this.props.annotationsObject.getActiveAnnotation();
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
          this.props.annotationsObject.setAnnotationCoordinates([]);
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
      this.props.imageData.width,
      this.props.imageData.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    for (let i = 0; i < splineVector.length; i += 1) {
      // transform points into canvas space so the nudge radius won't depend on zoom level:
      let point = splineVector[i];
      point = imageToCanvas(
        point.x,
        point.y,
        this.props.imageData.width,
        this.props.imageData.height,
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
    const {
      coordinates: currentSplineVector,
    } = this.props.annotationsObject.getActiveAnnotation();

    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.imageData.width,
      this.props.imageData.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    // check if we clicked within the nudge radius of an existing point:
    const nudgePointIdx = this.clickNearPoint(
      { x: imageX, y: imageY },
      currentSplineVector
    );
    const isClosed = this.isClosed(currentSplineVector);

    // If the mouse click was near an existing point, nudge that point
    if (nudgePointIdx !== -1) {
      const nudgePoint = currentSplineVector[nudgePointIdx];

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
          currentSplineVector.length - 1
        );
      }

      // If the spline is not closed, append a new point
    } else if (this.state.mode === Mode.draw && !isClosed) {
      // Add coordinates to the current spline
      currentSplineVector.push({ x: imageX, y: imageY });
      this.selectedPointIndex = currentSplineVector.length - 1;
    } else if (this.state.mode === Mode.edit) {
      this.addNewPointNearSpline(imageX, imageY);
    }

    this.drawAllSplines();
  };

  updateXYPoint = (newX: number, newY: number, index: number): void => {
    const { coordinates } = this.props.annotationsObject.getActiveAnnotation();
    coordinates[index] = { x: newX, y: newY };
  };

  closeLoop = (): void => {
    // Append the first spline point to the end, making a closed polygon

    const currentSplineVector = this.props.annotationsObject.getActiveAnnotation()
      .coordinates;

    if (currentSplineVector.length < 3) {
      return; // need at least three points to make a closed polygon
    }

    if (this.isClosed(currentSplineVector)) {
      return; // don't duplicate the first point again if the loop is already closed
    }

    currentSplineVector.push(currentSplineVector[0]);

    this.drawAllSplines();
  };

  snapToGradient = (idx: number, snapeRadius: number = 25): void => {
    // snaps point #idx in the current active spline to the maximum gradient point within snapeRadius
    if (this.gradientImage === undefined) return;
    const { coordinates } = this.props.annotationsObject.getActiveAnnotation();
    if (coordinates.length == 0) return;
    const point = coordinates[idx];

    const xMin = Math.floor(Math.max(0, point.x - snapeRadius));
    const xMax = Math.floor(
      Math.min(this.props.imageData.width - 1, point.x + snapeRadius)
    );
    const yMin = Math.floor(Math.max(0, point.y - snapeRadius));
    const yMax = Math.floor(
      Math.min(this.props.imageData.height - 1, point.y + snapeRadius)
    );
    console.log(xMin, xMax, yMin, yMax);
    let maxGradVal = 0;
    let maxGradX = Math.floor(point.x);
    let maxGradY = Math.floor(point.y);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        let i = (y * this.gradientImage.width + x) * 4 + 0; // using red channel values since gradientImage is always greyscale
        if (this.gradientImage.data[i] > maxGradVal) {
          maxGradVal = this.gradientImage.data[i];
          maxGradX = x;
          maxGradY = y;
        }
      }
    }
    console.log(point.x, point.y, maxGradX, maxGradY);
    this.updateXYPoint(maxGradX, maxGradY, idx);
  };

  onMouseDown = (x: number, y: number): void => {
    const clickPoint = canvasToImage(
      x,
      y,
      this.props.imageData.width,
      this.props.imageData.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.state.mode == Mode.magic) {
      // add a new point and snap it to the highest gradient point within 25 pixels:
      if (this.gradientImage === undefined) {
        this.gradientImage = calculateSobel(this.props.imageData);
        this.baseCanvas.canvasContext.putImageData(this.gradientImage, 0, 0);
        this.props.setUploadedImage(
          [this.gradientImage],
          new ImageFileInfo("balls")
        );
        console.log(this.gradientImage);
      }
      let { coordinates } = this.props.annotationsObject.getActiveAnnotation();
      coordinates.push(clickPoint);
      this.snapToGradient(0, 50);
      this.isDragging = true;
      this.drawAllSplines();
    } else {
      const annotationData = this.props.annotationsObject.getActiveAnnotation();

      const nearPoint = this.clickNearPoint(
        clickPoint,
        annotationData.coordinates
      );
      if (nearPoint !== -1) {
        this.selectedPointIndex = nearPoint;
        this.isDragging = true;
      }
    }
  };

  onMouseMove = (x: number, y: number): void => {
    if (!this.isDragging) return;

    // Replace update the coordinates for the point dragged
    const clickPoint = canvasToImage(
      x,
      y,
      this.props.imageData.width,
      this.props.imageData.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.state.mode == Mode.magic) {
      // add a new point and snap it to the highest gradient point within 25 pixels:
      let { coordinates } = this.props.annotationsObject.getActiveAnnotation();
      coordinates.push({ x: clickPoint.x, y: clickPoint.y });
      this.snapToGradient(coordinates.length - 1, 50);
    } else {
      // If dragging first point, update also last
      const activeSpline = this.props.annotationsObject.getActiveAnnotation()
        .coordinates;
      if (this.selectedPointIndex === 0 && this.isClosed(activeSpline)) {
        this.updateXYPoint(clickPoint.x, clickPoint.y, activeSpline.length - 1);
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
    const { coordinates } = this.props.annotationsObject.getActiveAnnotation();

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
    this.props.annotationsObject.setAnnotationCoordinates(coordinates); // Save new coordinates inside active annotation
  };

  private updateMode(): void {
    // FIXME this is a bit clumsy
    // Change mode if we change the spline type prop
    switch (this.props.splineType) {
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
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        cursor={this.state.isActive ? "crosshair" : "none"}
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
