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
  canvasContainerColour: number[];
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

  private getEdgeColour = (): string => {
    const [r, g, b] = [...this.props.canvasContainerColour];
    const edgeColour = 255 - (r + g + b) / 3;
    return `rgba(${edgeColour},${edgeColour},${edgeColour},1)`;
  };

  private applyView = (): void => {
    const lineWidth = 2;
    const edgeColour = this.getEdgeColour();
    console.log(edgeColour);

    this.boundingRect = getMinimapViewFinder(
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );
    this.baseCanvas.clearWindow();
    this.baseCanvas.canvasContext.beginPath();
    this.baseCanvas.canvasContext.strokeStyle = edgeColour;
    this.baseCanvas.canvasContext.lineWidth = lineWidth;
    this.baseCanvas.canvasContext.strokeRect(
      this.boundingRect.left + lineWidth / 2,
      this.boundingRect.top + lineWidth / 2,
      this.boundingRect.width - lineWidth,
      this.boundingRect.height - lineWidth
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
