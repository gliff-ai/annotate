import React from "react";
import { ReactNode } from "react";
import { Props as BaseProps, BaseCanvas } from "./Canvas";
import { getMinimapViewFinder, minimapToCanvas } from "../transforms";
import { PositionAndSize } from "../annotation/interfaces";

export interface Props extends BaseProps {
  cursor?: "move";
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
  private isDragging: boolean;

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
    if (this.props.imageData) {
    this.boundingRect = getMinimapViewFinder(
      this.props.imageData.width,
      this.props.imageData.height,
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
    }
  };

  /*** Mouse events ****/
  onDoubleClick = (minimapX: number, minimapY: number): void => {
    // DO STUFF
  };

  panToMinimapTarget = (minimapX: number, minimapY: number) => {
    // convert minimap click into viewport coordinate frame
    const { x: targetX, y: targetY } = minimapToCanvas(
      minimapX,
      minimapY,
      this.props.imageData.width,
      this.props.imageData.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );

    // calculate the vector from the current canvas centre to the target position:
    const translateX = targetX - this.props.canvasPositionAndSize.width / 2;
    const translateY = targetY - this.props.canvasPositionAndSize.height / 2;

    // update scaleAndPan using the method passed down from UI
    this.props.setScaleAndPan({
      scale: this.props.scaleAndPan.scale,
      x: this.props.scaleAndPan.x - translateX,
      y: this.props.scaleAndPan.y - translateY,
    });
  };

  onClick = (minimapX: number, minimapY: number): void => {
    this.panToMinimapTarget(minimapX, minimapY);
  };

  onMouseDown = (minimapX: number, minimapY: number): void => {
    this.isDragging = true;
  };

  onMouseMove = (minimapX: number, minimapY: number): void => {
    if (this.isDragging) {
      this.panToMinimapTarget(minimapX, minimapY);
    }
  };

  onMouseUp = (minimapX: number, minimapY: number): void => {
    this.isDragging = false;
  };

  onContextMenu = (minimapX: number, minimapY: number): void => {
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
