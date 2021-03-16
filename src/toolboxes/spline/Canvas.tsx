import React from "react";
import { Component } from "react";

// import { SplineVector } from "./interfaces";
import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
import { Annotations } from "../../annotation";
import { XYPoint } from "../../annotation/interfaces";
import { ClientPoint } from "../../baseCanvas/CoordinateSystem";

interface Props extends BaseProps {
  isActive: boolean;
  annotationsObject: Annotations;
  imageScalingFactor: number;
}

export class SplineCanvas extends Component<Props> {
  private baseCanvas: any;
  state: {
    cursor: "crosshair" | "none";
  };

  constructor(props: Props) {
    super(props);
  }

  drawSplineVector = (currentSplineVector: XYPoint[]) => {
    if (currentSplineVector.length < 2) return;

    const { canvasContext: context, canvas } = this.baseCanvas;
    const lineWidth = 1.5;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = lineWidth;
    context.strokeStyle = "#ff0000";

    context.beginPath();

    // Go to the first point
    const { x: originX, y: originY } = currentSplineVector[0];

    let scalePoint = (x: number, y: number) => {
      return {clientX: x * this.props.imageScalingFactor, clientY: y * this.props.imageScalingFactor}
    }

    let scaledPoint = scalePoint(originX, originY)

    const {x: scaledOriginX, y: scaledOriginY} = this.baseCanvas.scaledCanvasToCanvas(scaledPoint);
    context.moveTo(scaledOriginX, scaledOriginY);

    // Draw each point by taking our raw coordinates and applying the transform so they fit on our canvas
    for (const { x, y } of currentSplineVector) {
      scaledPoint = scalePoint(x, y);
      const {x: scaledX, y: scaledY} = this.baseCanvas.scaledCanvasToCanvas(scaledPoint);
      context.lineTo(scaledX, scaledY);
    }

    context.stroke();
    context.closePath();
  };

  // X and Y are in CanvasSpace
  onClick = (x: number, y: number): void => {
    const {
      coordinates: currentSplineVector,
    } = this.props.annotationsObject.getActiveAnnotation();

    currentSplineVector.push({ x: x / this.props.imageScalingFactor, y: y / this.props.imageScalingFactor });

    this.drawSplineVector(currentSplineVector);
  };

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const activeAnnotation = this.props.annotationsObject.getActiveAnnotation();
    if (activeAnnotation?.coordinates) {
      this.drawSplineVector(activeAnnotation.coordinates);
    }
  }

  render() {
    return (
      <BaseCanvas
        onClick={this.onClick}
        cursor={this.props.isActive ? "crosshair" : "none"}
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
        name="spline"
        scaleAndPan={this.props.scaleAndPan}
      />
    );
  }
}
