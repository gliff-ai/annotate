import React from "react";
import { Component } from "react";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";

interface Props extends BaseProps {
  isActive: boolean;
}

export class SplineCanvas extends Component<Props> {
  private baseCanvas: any;
  state: {
    cursor: "crosshair" | "none";
  };

  constructor(props: Props) {
    super(props);
  }

  onClick(x: number, y: number): void {
    console.log(`OnCLick SPline ${x}, ${y}`);
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
