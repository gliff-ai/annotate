import React from "react";
import { ReactNode } from "react";
import { Props as BaseProps, BaseCanvas } from "./Canvas";
import {
  originalCanvasToMinimap,
  minimapToOriginalCanvas,
} from "../annotation";
import { PositionAndSize } from "../annotation/interfaces";

export interface Props extends BaseProps {
  cursor?: "move";
  imageWidth: number;
  imageHeight: number;
  canvasPositionAndSize: PositionAndSize;
  minimapPositionAndSize: PositionAndSize;
  setScaleAndPan: (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }) => void;
  setMinimapPositionAndSize?: (minimapPositionAndSize: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  }) => void;
}

export class BaseMinimap extends React.Component<Props> {
  public baseCanvas: BaseCanvas;
  private boundingRect: PositionAndSize;

  constructor(props: Props) {
    super(props);
  }

  componentDidMount = (): void => {
    this.applyView();
  };

  componentDidUpdate = (): void => {
    this.applyView();
  };

  private applyView = (): void => {
    this.boundingRect = originalCanvasToMinimap(
      this.props.imageWidth,
      this.props.imageHeight,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );
    this.baseCanvas.clearWindow();
    this.baseCanvas.canvasContext.beginPath();
    this.baseCanvas.canvasContext.strokeStyle = "#FFFFFF";
    this.baseCanvas.canvasContext.lineWidth = 3;
    this.baseCanvas.canvasContext.strokeRect(
      this.boundingRect.left,
      this.boundingRect.top,
      this.boundingRect.width,
      this.boundingRect.height
    );
  };

  /*** Mouse events ****/
  onDoubleClick = (canvasX: number, canvasY: number): void => {
    // DO STUFF
  };

  onClick = (canvasX: number, canvasY: number): void => {
    // convert minimap click into viewport coordinate frame
    const { x: viewportX, y: viewportY } = minimapToOriginalCanvas(
      canvasX,
      canvasY,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );

    // calculate top left for zoom centred on these coordinates
    const left =
      viewportX * this.props.scaleAndPan.scale -
      this.props.canvasPositionAndSize.width / 2;
    const top =
      viewportY * this.props.scaleAndPan.scale -
      this.props.canvasPositionAndSize.height / 2;

    // update scaleAndPan using the method passed down from UI
    this.props.setScaleAndPan({
      scale: this.props.scaleAndPan.scale,
      x: -left,
      y: -top,
    });
  };

  onMouseDown = (canvasX: number, canvasY: number): void => {
    // DO STUFF
  };

  onMouseMove = (canvasX: number, canvasY: number): void => {
    // DO STUFF
  };

  onMouseUp = (canvasX: number, canvasY: number): void => {
    // DO STUFF
  };

  onContextMenu = (canvasX: number, canvasY: number): void => {
    // DO STUFF
  };

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
        setCanvasPositionAndSize={this.props.setMinimapPositionAndSize}
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
      />
    );
  };
}
