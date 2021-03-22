import React, { ReactNode } from "react";
import { Component } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "../../baseCanvas";
import {
  Annotations,
  canvasToImage,
  imageToCanvas,
  imageToOriginalCanvas,
} from "../../annotation";
import { Annotation, XYPoint } from "../../annotation/interfaces";

interface Props extends BaseProps {
  isActive: boolean;
  annotationsObject: Annotations;
  imageWidth: number;
  imageHeight: number;
}

export const events = ["deleteSelectedPoint"] as const;
export type Events = typeof events[number];

export class SplineCanvas extends Component<Props> {
  private baseCanvas: BaseCanvas;
  private selectedPointIndex: number;
  private isDragging: boolean;
  state: {
    cursor: "crosshair" | "none";
  };

  constructor(props: Props) {
    super(props);
    this.selectedPointIndex = -1;
    this.isDragging = false;
  }

  drawSplineVector = (splineVector: XYPoint[], isActive = false): void => {
    if (splineVector.length < 2) return;

    const { canvasContext: context } = this.baseCanvas;
    const lineWidth = isActive ? 2 : 1;

    // Clear the canvas
    context.lineWidth = lineWidth;
    context.strokeStyle = "#ff0000";
    context.fillStyle = "#0000ff";

    context.beginPath();

    // Go to the first point
    let firstPoint: XYPoint = splineVector[0];
    firstPoint = imageToOriginalCanvas(
      firstPoint.x,
      firstPoint.y,
      this.props.imageWidth,
      this.props.imageHeight,
      this.props.canvasPositionAndSize
    );

    context.moveTo(firstPoint.x, firstPoint.y);

    // Draw each point by taking our raw coordinates and applying the transform so they fit on our canvas
    let nextPoint;
    for (const { x, y } of splineVector) {
      nextPoint = imageToOriginalCanvas(
        x,
        y,
        this.props.imageWidth,
        this.props.imageHeight,
        this.props.canvasPositionAndSize
      );
      context.lineTo(nextPoint.x, nextPoint.y);
    }

    context.stroke();

    // Draw all points
    context.beginPath();
    splineVector.forEach(({ x, y }, i) => {
      if (i !== splineVector.length - 1 || !this.isClosed(splineVector)) {
        nextPoint = imageToOriginalCanvas(
          x,
          y,
          this.props.imageWidth,
          this.props.imageHeight,
          this.props.canvasPositionAndSize
        );
        if (this.selectedPointIndex === i && isActive) {
          context.fillRect(nextPoint.x - 3, nextPoint.y - 3, 6, 6); // draw a filled square to mark the point as selected
        } else {
          context.rect(nextPoint.x - 3, nextPoint.y - 3, 6, 6); // draw a square to mark the point
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

  public handleShortcut = (event: Events) => {
    this[event].call(this);
  };

  // private handleSingleKeydown = (event: KeyboardEvent) => {
  //   // Handle single-key events.
  //   // TODO: move this to ui
  //   console.log(event);
  //
  //   let keyString =
  //     (event.ctrlKey ? "ctrl+" : "") +
  //     (event.shiftKey ? "shift+" : "") +
  //     (event.altKey ? "alt+" : "") +
  //     event.key.toLowerCase();
  //
  //   console.log(keyString);
  //
  //   const methodName = keyBindings["ctrl+delete"];
  //
  //   this[methodName]();
  //
  //   // eval("this." + methodName + "()");
  //
  //   // switch (event.code) {
  //   //   case "Delete": // Delete selected point
  //   //     this.deleteSelectedPoint();
  //   //     break;
  //   //   case "Minus": // Delete selected point
  //   //     this.deleteSelectedPoint();
  //   //     break;
  //   //   case "Escape": // Escape selected point
  //   //     // TODO: add function for removing selection
  //   //     break;
  //   // }
  // };

  deleteSelectedPoint = (): void => {
    if (this.selectedPointIndex === -1) return;
    console.log("deleting point");
    const coordinates = this.props.annotationsObject.getActiveAnnotation()
      .coordinates;
    const isClosed = this.isClosed(coordinates);

    console.log(this.selectedPointIndex);
    console.log(coordinates);

    if (this.selectedPointIndex === coordinates.length - 1) {
      this.selectedPointIndex = 0;
    }
    coordinates.splice(this.selectedPointIndex, 1);

    if (this.selectedPointIndex === 0 && isClosed) {
      console.log("updating last point");
      this.updateXYPoint(
        coordinates[0].x,
        coordinates[0].y,
        coordinates.length - 1
      );
    }

    if (this.selectedPointIndex === coordinates.length - 1) {
      this.selectedPointIndex = 0;
    }

    this.drawAllSplines();

    console.log(this.selectedPointIndex);
    console.log(coordinates);
  };

  clickNearPoint = (clickPoint: XYPoint, splineVector: XYPoint[]): number => {
    // iterates through the points of splineVector, returns the index of the first point within distance 25 of clickPoint
    // clickPoint and splineVector are both expected to be in image space
    // returns -1 if no point was within distance 25

    const { x: clickPointX, y: clickPointY } = imageToCanvas(
      clickPoint.x,
      clickPoint.y,
      this.props.imageWidth,
      this.props.imageHeight,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    for (let i = 0; i < splineVector.length; i++) {
      // transform points into canvas space so the nudge radius won't depend on zoom level:
      let point = splineVector[i];
      point = imageToCanvas(
        point.x,
        point.y,
        this.props.imageWidth,
        this.props.imageHeight,
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
      this.props.imageWidth,
      this.props.imageHeight,
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
    } else if (!isClosed) {
      // Add coordinates to the current spline
      console.log("Adding point", { x: imageX, y: imageY });
      currentSplineVector.push({ x: imageX, y: imageY });
      this.selectedPointIndex = currentSplineVector.length - 1;
    }

    this.drawAllSplines();
  };

  updateXYPoint = (newX: number, newY: number, index: number): void => {
    const coordinates = this.props.annotationsObject.getActiveAnnotation()
      .coordinates;
    coordinates[index] = { x: newX, y: newY };
  };

  onDoubleClick = (x: number, y: number): void => {
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
      this.props.imageWidth,
      this.props.imageHeight,
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
      this.props.imageWidth,
      this.props.imageHeight,
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
    // TODO: add shortcut for setting selectedPointIndex = -1
    this.isDragging = false;
  };

  isClosed = (splineVector: XYPoint[]): boolean => {
    // Check whether the spline is a closed loop.
    return (
      splineVector.length > 1 &&
      splineVector[0].x === splineVector[splineVector.length - 1].x &&
      splineVector[0].y === splineVector[splineVector.length - 1].y
    );
  };

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const activeAnnotation = this.props.annotationsObject.getActiveAnnotation();
    if (activeAnnotation?.coordinates) {
      this.drawAllSplines();
    }
  }

  render = (): ReactNode => {
    return (
      <div style={{ pointerEvents: this.props.isActive ? "auto" : "none" }}>
        <BaseCanvas
          onClick={this.onClick}
          onDoubleClick={this.onDoubleClick}
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          cursor={this.props.isActive ? "crosshair" : "none"}
          ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
          name="spline"
          scaleAndPan={this.props.scaleAndPan}
          canvasPositionAndSize={this.props.canvasPositionAndSize}
          setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
        />
      </div>
    );
  };
}
