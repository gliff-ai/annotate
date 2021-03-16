import React from "react";
import { Component } from "react";

// import { SplineVector } from "./interfaces";
import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
import { Annotations } from "../../annotation";

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

  onClick = (x: number, y: number): void => {
    const {
      coordinates: currentSplineVector,
    } = this.props.annotationsObject.getActiveAnnotation();
    currentSplineVector.push({ x, y });
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
