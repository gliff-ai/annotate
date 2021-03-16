import React from "react";
import { Component } from "react";

import { SplineVector } from "./interfaces";
import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
import { Annotations } from "../../annotation";

interface Props extends BaseProps {
  isActive: boolean;
  annotationData: Annotations;
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
    console.log(this);
    console.log(`OnCLick SPline ${x}, ${y}`);
    this.props.annotationData.addLayer(1, "spline", [], { z: 0, t: 0 }, null);
    debugger;
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
