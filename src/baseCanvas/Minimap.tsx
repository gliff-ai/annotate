import React from "react";
import { ReactNode } from "react";
import { Props as BaseProps, BaseCanvas } from "./Canvas";

export interface Props {
  name?: string;
  cursor?: "move";
  onClick?: (arg0: number, arg1: number) => void;
  canvasPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export class BaseMinimap extends React.Component<Props> {
  private baseCanvas: any;

  constructor(props: Props) {
    super(props);
  }

  render = (): ReactNode => {
    return (
      <BaseCanvas
        cursor="move"
        onClick={this.props.onClick}
        name={this.props.name}
        scaleAndPan={{ x: 0, y: 0, scale: 1 }}
        canvasPositionAndSize={this.props.canvasPositionAndSize}
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
      />
    );
  };
}
