import React from "react";
import { ReactNode } from "react";
import { Props as BaseProps, BaseCanvas } from "./Canvas";

export interface Props extends BaseProps {
  cursor?: "move";
}

export class BaseMinimap extends React.Component<Props> {
  private baseCanvas: any;
  private boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  constructor(props: Props) {
    super(props);
    this.boundingRect = { x: 0, y: 0, width: 50, height: 50 };
  }

  componentDidMount = (): void => {
    this.applyView();
  };

  componentDidUpdate = (): void => {
    this.applyView();
  };

  private applyView = (): void => {
    this.baseCanvas.clearWindow();
    this.baseCanvas.canvasContext.beginPath();
    this.baseCanvas.canvasContext.strokeRect(
      this.boundingRect.x,
      this.boundingRect.y,
      this.boundingRect.width,
      this.boundingRect.height
    );
  };

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
