import React, { ReactNode, Component } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { Annotations } from "@/annotation";
import { canvasToImage, imageToCanvas } from "@/transforms";
import { Annotation, XYPoint } from "@/annotation/interfaces";
import { theme } from "@/theme";

interface Props extends BaseProps {
  isActive: boolean;
  annotationsObject: Annotations;
  callRedraw: number;
}
enum Mode {
  draw,
  edit,
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
  cursor: "crosshair" | "none";
}

export class SplineCanvas extends Component<Props, State> {
  readonly name = "spline";

  private baseCanvas: BaseCanvas;

  private selectedPointIndex: number;

  private isDragging: boolean;

  private mode: number;

  constructor(props: Props) {
    super(props);
    this.selectedPointIndex = -1;
    this.isDragging = false;
    this.mode = Mode.draw;
  }

  componentDidMount(): void {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  }

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const activeAnnotation = this.props.annotationsObject.getActiveAnnotation();

    if (activeAnnotation?.coordinates) {
      this.drawAllSplines();
    }
    if (activeAnnotation?.coordinates.length === 0) {
      this.mode = Mode.draw; // At change of active annotation, set mode to drawing mode (default)
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
        if (annotation.toolbox === "spline") {
          this.drawSplineVector(
            annotation.coordinates,
            i === activeAnnotationID
          );
        }
      });
  };

  private changeSplineModeToEdit = () => {
    // TODO: add keyboard shortcuts for switching between modes
    this.mode = Mode.edit; // Change mode to edit mode
    this.deselectPoint();
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
      this.mode = Mode.draw;
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

    if (nudgePointIdx !== -1) {
      // If the mouse click was near an existing point, nudge that point
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
    } else if (this.mode === Mode.draw && !isClosed) {
      // Add coordinates to the current spline
      currentSplineVector.push({ x: imageX, y: imageY });
      this.selectedPointIndex = currentSplineVector.length - 1;
    } else if (this.mode === Mode.edit) {
      // In edit mode a single click allows to select splines
      const selectedSpline = this.clickNearSpline(imageX, imageY);
      if (selectedSpline !== -1) {
        // Change active spline to selected spline
        this.props.annotationsObject.setActiveAnnotationID(selectedSpline);
      }
    }

    this.drawAllSplines();
  };

  clickNearSpline = (imageX: number, imageY: number): number => {
    // Check if the clicked (x,y) point in image space belongs to an existing spline.
    // If true, return spline index, otherwise return -1.
    const annotations = this.props.annotationsObject.getAllAnnotations();

    for (let i = 0; i < annotations.length; i += 1) {
      if (annotations[i].toolbox === "spline") {
        let { coordinates } = annotations[i];
        for (let j = 1; j < coordinates.length; j += 1) {
          if (
            this.isPointOnLineSegment(
              { x: imageX, y: imageY },
              coordinates[j - 1],
              coordinates[j]
            )
          ) {
            return i;
          }
        }
      }
    }
    return -1;
  };

  isPointOnLineSegment = (
    point: XYPoint,
    point1: XYPoint,
    point2: XYPoint
  ): boolean => {
    // Check if a XYpoint belongs to the line segment with endpoints XYpoint 1 and XYpoint 2.
    const dx = point.x - point1.x;
    const dy = point.y - point1.y;
    const dxLine = point2.x - point1.x;
    const dyLine = point2.y - point1.y;
    // Use the cross-product to check whether the XYpoint lies on the line passing
    // through XYpoint 1 and XYpoint 2.
    const crossProduct = dx * dyLine - dy * dxLine;
    // If the XYpoint is exactly on the line the cross-product is zero. Here we set a threshold
    // based on ease of use, to accept points that are close enough to the spline.
    if (Math.abs(crossProduct) > 700) return false;

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
    if (this.mode === Mode.draw) return;
    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.imageData.width,
      this.props.imageData.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );
    this.addNewPointNearSpline(imageX, imageY);
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

  onMouseDown = (x: number, y: number): void => {
    const clickPoint = canvasToImage(
      x,
      y,
      this.props.imageData.width,
      this.props.imageData.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );
    const annotationData = this.props.annotationsObject.getActiveAnnotation();

    const nearPoint = this.clickNearPoint(
      clickPoint,
      annotationData.coordinates
    );
    if (nearPoint !== -1) {
      this.selectedPointIndex = nearPoint;
      this.isDragging = true;
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

    // If dragging first point, update also last
    const activeSpline = this.props.annotationsObject.getActiveAnnotation()
      .coordinates;
    if (this.selectedPointIndex === 0 && this.isClosed(activeSpline)) {
      this.updateXYPoint(clickPoint.x, clickPoint.y, activeSpline.length - 1);
    }

    this.updateXYPoint(clickPoint.x, clickPoint.y, this.selectedPointIndex);

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

  render = (): ReactNode => (
    <div style={{ pointerEvents: this.props.isActive ? "auto" : "none" }}>
      <BaseCanvas
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        cursor={this.props.isActive ? "crosshair" : "none"}
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
