import React from "react";
import { Component } from "react";

// import { SplineVector } from "./interfaces";
import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
import { Annotations } from "../../annotation";
import { canvasToImage, imageToCanvas, imageToOriginalCanvas } from "../../baseCanvas";
import { Annotation, XYPoint } from "../../annotation/interfaces";

interface Props extends BaseProps {
  isActive: boolean;
  annotationsObject: Annotations;
  imageWidth: number;
  imageHeight: number;
}

export class SplineCanvas extends Component<Props> {
  private baseCanvas: any;
  state: {
    cursor: "crosshair" | "none";
  };

  constructor(props: Props) {
    super(props);
  }

  drawSplineVector = (splineVector: XYPoint[]) => {
    if (splineVector.length < 2) return;

    const { canvasContext: context, canvas } = this.baseCanvas;
    const lineWidth = 1.5;

    // Clear the canvas
    context.lineWidth = lineWidth;
    context.strokeStyle = "#ff0000";

    context.beginPath();

    // Go to the first point
    let firstPoint: XYPoint = splineVector[0];
    firstPoint = imageToOriginalCanvas(firstPoint.x, firstPoint.y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);

    context.moveTo(firstPoint.x, firstPoint.y);

    // Draw each point by taking our raw coordinates and applying the transform so they fit on our canvas
    let nextPoint;
    for (const { x, y } of splineVector) {
      nextPoint = imageToOriginalCanvas(x, y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);
      context.lineTo(nextPoint.x, nextPoint.y);
    }

    context.stroke();
    context.closePath();
  };

  drawAllSplines = (): void => {
    // Draw all the splines 

    // Clear all the splines:
    const { canvasContext: context, canvas } = this.baseCanvas;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all the splines:
    this.props.annotationsObject.getData().forEach((annotation: Annotation) => {
      if (annotation.toolbox === "spline") {
        this.drawSplineVector(annotation.coordinates);
      }
    });
  }

  // X and Y are in CanvasSpace
  onClick = (x: number, y: number): void => {
    const {
      coordinates: currentSplineVector,
    } = this.props.annotationsObject.getActiveAnnotation();

    let {x:imageX, y:imageY} = canvasToImage(x, y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);
    console.log(imageX, imageY);

    // Don't append a new point if the spline is a closed loop:
    if (this.isClosed(currentSplineVector)) return;

    // Add coordinates to the current spline
    currentSplineVector.push({ x: imageX, y: imageY });
    
    this.drawAllSplines();
  };

  onDoubleClick = (x: number, y: number): void => {
    // Append the first spline point to the end, making a closed polygon

    const {
      coordinates: currentSplineVector,
    } = this.props.annotationsObject.getActiveAnnotation();

    console.log("onDoubleClick")

    if (currentSplineVector.length < 3) {
      return; // need at least three points to make a closed polygon
    }
    
    currentSplineVector.push(currentSplineVector[0]);

    this.drawAllSplines();
  }

  isClosed = (splineVector: XYPoint[]): boolean => {
    // Check whether the spline is a closed loop.
    return ((splineVector.length > 1 ) && 
    (splineVector[0].x === splineVector[splineVector.length-1].x) && 
    (splineVector[0].y === splineVector[splineVector.length-1].y ) );
  }

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const activeAnnotation = this.props.annotationsObject.getActiveAnnotation();
    if (activeAnnotation?.coordinates) {
      this.drawAllSplines();
    }
  }

  render() {
    return (
      <BaseCanvas
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        cursor={this.props.isActive ? "crosshair" : "none"}
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
        name="spline"
        scaleAndPan={this.props.scaleAndPan}
      />
    );
  }
}
