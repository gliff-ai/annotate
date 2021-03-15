import React from "react";
import { Component } from "react";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";

interface Props extends BaseProps {
  isActive: boolean;
}

export class SplineCanvas extends Component<Props> {
  private baseCanvas: any;
  state: {
    cursor: "pointer" | "none";
  };

  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <BaseCanvas
        cursor={this.props.isActive ? "pointer" : "none"}
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
        name="splineDrawing"
        scaleAndPan={this.props.scaleAndPan}
      />
    );
  }
}
