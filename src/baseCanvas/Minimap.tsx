import React from "react";
import { ReactNode } from "react";
import { Props as BaseProps, BaseCanvas } from "./Canvas";
import { getMinimapViewFinder, minimapToCanvas } from "../annotation";
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
    this.boundingRect = getMinimapViewFinder(
      this.props.imageWidth,
      this.props.imageHeight,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );
    this.baseCanvas.clearWindow();
    this.baseCanvas.canvasContext.beginPath();
    this.baseCanvas.canvasContext.strokeStyle = "#FFFFFF";
    this.baseCanvas.canvasContext.lineWidth = 2;
    this.baseCanvas.canvasContext.strokeRect(
      this.boundingRect.left + 1,
      this.boundingRect.top + 1,
      this.boundingRect.width - 2,
      this.boundingRect.height - 2
    ); // +1 and -2 shift the box's centerline so the outer edge of the drawn box will trace the viewfinder
  };

  /*** Mouse events ****/
  onDoubleClick = (canvasX: number, canvasY: number): void => {
    // DO STUFF
  };

  onClick = (canvasX: number, canvasY: number): void => {
    // convert minimap click into viewport coordinate frame
    const { x: targetX, y: targetY } = minimapToCanvas(
      canvasX,
      canvasY,
      this.props.imageWidth,
      this.props.imageHeight,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );

    // calculate the vector from the current canvas centre to the requested position:
    const translateX = targetX - this.props.canvasPositionAndSize.width / 2;
    const translateY = targetY - this.props.canvasPositionAndSize.height / 2;

    // update scaleAndPan using the method passed down from UI
    this.props.setScaleAndPan({
      scale: this.props.scaleAndPan.scale,
      x: this.props.scaleAndPan.x - translateX,
      y: this.props.scaleAndPan.y - translateY,
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
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
      />
    );
  };
}
