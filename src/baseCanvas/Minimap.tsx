import React, { ReactNode } from "react";
import { getMinimapViewFinder, minimapToCanvas } from "@/transforms";
import { PositionAndSize } from "@/annotation/interfaces";
import { Props as BaseProps, BaseCanvas } from "./Canvas";

export interface Props extends BaseProps {
  cursor?: "move";
  canvasPositionAndSize: PositionAndSize;
  minimapPositionAndSize: PositionAndSize;
  setScaleAndPan: (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }) => void;
  setMinimapPositionAndSize?: (minimapPositionAndSize: PositionAndSize) => void;
}

export class MinimapCanvas extends React.Component<Props> {
  public baseCanvas: BaseCanvas;

  private boundingRect: PositionAndSize;

  private isDragging: boolean;

  componentDidMount = (): void => {
    this.applyView();
  };

  componentDidUpdate = (): void => {
    this.applyView();
  };

  private applyView = (): void => {
    this.boundingRect = getMinimapViewFinder(
      this.props.displayedImage.width,
      this.props.displayedImage.height,
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
    );
  };

  panToMinimapTarget = (minimapX: number, minimapY: number): void => {
    // convert minimap click into viewport coordinate frame
    const { x: targetX, y: targetY } = minimapToCanvas(
      minimapX,
      minimapY,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
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

  onMouseDown = (): void => {
    this.isDragging = true;
  };

  onMouseMove = (minimapX: number, minimapY: number): void => {
    if (this.isDragging) {
      this.panToMinimapTarget(minimapX, minimapY);
    }
  };

  onMouseUp = (): void => {
    this.isDragging = false;
  };

  render = (): ReactNode => (
    <BaseCanvas
      cursor="move"
      onClick={this.onClick}
      onMouseDown={this.onMouseDown}
      onMouseMove={this.onMouseMove}
      onMouseUp={this.onMouseUp}
      name={this.props.name}
      scaleAndPan={{ x: 0, y: 0, scale: 1 }}
      canvasPositionAndSize={this.props.minimapPositionAndSize}
      setCanvasPositionAndSize={this.props.setMinimapPositionAndSize}
      ref={(baseCanvas) => {
        this.baseCanvas = baseCanvas;
      }}
    />
  );
}
