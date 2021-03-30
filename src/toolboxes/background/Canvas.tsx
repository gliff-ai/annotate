import React, { Component, ReactNode } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseToolbox";
import { drawImageOnCanvas } from "./drawImage";

interface Props extends BaseProps {
  imgSrc?: string;
  updateImageData: (image: ImageData) => void;
  contrast: number;
  brightness: number;
}

export class BackgroundCanvas extends Component<Props> {
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
      //   this.baseCanvas.canvasContext.globalCompositeOperation =
      ("destination-over");
      drawImageOnCanvas(
        this.baseCanvas.canvasContext,
        this.image,
        this.props.scaleAndPan
      );
    }
  };

  private drawImage = () => {
    if (this.props.imgSrc) {
      // Load the image
      this.image = new Image();

      // Prevent SecurityError "Tainted canvases may not be exported." #70
      this.image.crossOrigin = "anonymous";

      // Draw the image once loaded
      this.image.onload = () => {
        this.redrawImage();
        //   this.props.updateImageDimensions(this.image.width, this.image.height);
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
    } else if (this.props.imageData) {
      this.redrawImage();
    }
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
