import React from "react";
import { Component } from "react";

// import { SplineVector } from "./interfaces";
import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
import { Annotations } from "../../annotation";
import { XYPoint } from "../../annotation/interfaces";

interface Props extends BaseProps {
  isActive: boolean;
  annotationsObject: Annotations;
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
    console.log(`Drawing: ${currentSplineVector}`);

    if (currentSplineVector.length < 2) return;

    const context = this.baseCanvas.canvasContext;
    const canvas = this.baseCanvas.canvasContext;
    const lineWidth = 1.5;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = lineWidth;
    context.strokeStyle = "#ff0000";

    context.beginPath();

    // Go to the first point
    const { x: originX, y: originY } = currentSplineVector[0];

    context.moveTo(originX, originY);

    // Draw each point by taking our raw coordinates and applying the transform so they fit on our canvas
    for (const { x, y } of currentSplineVector) {
      // Why aren't we having to transform these!?!?!
      context.lineTo(x, y);
    }

    context.stroke();
    context.closePath();
  };

  onClick = (x: number, y: number): void => {
    const {
      coordinates: currentSplineVector,
    } = this.props.annotationsObject.getActiveAnnotation();

    currentSplineVector.push({ x, y });

    this.drawSplineVector(currentSplineVector);
  };

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
