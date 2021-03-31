import React, { Component, ReactNode, ReactElement } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import drawImageOnCanvas from "./drawImage";

import { useBackgroundStore } from "./Store";

interface Props extends BaseProps {
  imgSrc?: string;
  updateImageData: (imageData: ImageData) => void;
  contrast: number;
  brightness: number;
}

export class BackgroundCanvasClass extends Component<Props> {
  private baseCanvas: BaseCanvas;

  private image: HTMLImageElement;

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate = (): void => {
    this.redrawImage();
  };

  private redrawImage = () => {
    if (this.image && this.image.complete) {
      this.baseCanvas.canvasContext.filter = `contrast(${this.props.contrast}%) brightness(${this.props.brightness}%)`;
      this.baseCanvas.canvasContext.globalCompositeOperation =
        "destination-over";
      drawImageOnCanvas(
        this.baseCanvas.canvasContext,
        this.image,
        this.props.scaleAndPan
      );
    }
  };

  private drawImage = () => {
    if (!this.props.imgSrc) return;

    // Load the image
    this.image = new Image();

    // Prevent SecurityError "Tainted canvases may not be exported." #70
    this.image.crossOrigin = "anonymous";

    // Draw the image once loaded
    this.image.onload = () => {
      this.redrawImage();
      this.props.updateImageData(
        this.baseCanvas.canvasContext.getImageData(
          0,
          0,
          this.image.width,
          this.image.height
        )
      );
    };
    this.image.src = this.props.imgSrc;
  };

  render = (): ReactNode => (
    <BaseCanvas
      ref={(baseCanvas) => {
        this.baseCanvas = baseCanvas;
      }}
      name="background"
      scaleAndPan={this.props.scaleAndPan}
      zoomExtents={{ min: 0.3, max: 3 }}
      canvasPositionAndSize={this.props.canvasPositionAndSize}
    />
  );
}

export const BackgroundCanvas = (
  props: Omit<Props, "contrast" | "brightness">
): ReactElement => {
  const [background] = useBackgroundStore();

  return (
    <BackgroundCanvasClass
      imgSrc={props.imgSrc}
      updateImageData={props.updateImageData}
      contrast={background.contrast}
      brightness={background.brightness}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
    />
  );
};
