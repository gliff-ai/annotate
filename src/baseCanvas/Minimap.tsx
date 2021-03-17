import React from "react";
import { ReactNode } from "react";
import { Props as BaseProps, BaseCanvas } from "./Canvas";
import { originalCanvastoMinimap } from "../annotation";

export interface Props extends BaseProps {
  cursor?: "move";
  imageWidth: number;
  imageHeight: number;
  minimapPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
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
    this.boundingRect = {
      x: 0,
      y: 0,
      width: this.props.minimapPositionAndSize.width,
      height: this.props.minimapPositionAndSize.height,
    };
  }

  componentDidMount = (): void => {
    this.applyView();
  };

  componentDidUpdate = (): void => {
    this.applyView();
  };

  private applyView = (): void => {
    this.boundingRect = originalCanvastoMinimap(
      this.props.imageWidth,
      this.props.imageHeight,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );
    this.baseCanvas.clearWindow();
    this.baseCanvas.canvasContext.beginPath();
    this.baseCanvas.canvasContext.strokeStyle = "#666666";
    this.baseCanvas.canvasContext.lineWidth = 3;
    this.baseCanvas.canvasContext.strokeRect(
      this.boundingRect.x,
      this.boundingRect.y,
      this.boundingRect.width,
      this.boundingRect.height
    );
  };

  /*** Mouse events ****/
  onDoubleClick = (canvasX: number, canvasY: number): void => {};

  onClick = (canvasX: number, canvasY: number): void => {};

  onMouseDown = (canvasX: number, canvasY: number): void => {};

  onMouseMove = (canvasX: number, canvasY: number): void => {};

  onMouseUp = (canvasX: number, canvasY: number): void => {};

  onContextMenu = (canvasX: number, canvasY: number): void => {};

  render = (): ReactNode => {
    return (
      <BaseCanvas
        cursor="move"
        onDoubleClick={this.onDoubleClick}
        onClick={this.onClick}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        onContextMenu={this.onContextMenu}
        name={this.props.name}
        scaleAndPan={{ x: 0, y: 0, scale: 1 }}
        canvasPositionAndSize={this.props.minimapPositionAndSize}
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
      />
    );
  };
}
