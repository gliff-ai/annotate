import React from "react";
import { Component, ReactNode } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "../../baseCanvas";
import drawImageOnCanvas from "./drawImage";
import ImageFileInfo from "../../ImageFileInfo";

interface Props extends BaseProps {
  imgSrc: string | null;
  imageFileInfo: ImageFileInfo;
  sliceIndex: number;
  updateImageDimensions: (imageWidth: number, imageHeight: number) => void;
  contrast: number;
  brightness: number;
}

export class BackgroundCanvas extends Component<Props> {
  private baseCanvas: BaseCanvas;
  private image: HTMLImageElement | OffscreenCanvas;

  constructor(props: Props) {
    super(props);
  }

  private drawImage = () => {
    // Update image brightness and contrast
    this.baseCanvas.canvasContext.filter = `contrast(${this.props.contrast}%) brightness(${this.props.brightness}%)`;

    // Any annotation that is already on the canvas is put on top of any new annotation
    this.baseCanvas.canvasContext.globalCompositeOperation = "destination-over";

    if (this.props.imgSrc) {
      if (this.image && (this.image as HTMLImageElement).complete) {
        drawImageOnCanvas(
          this.baseCanvas.canvasContext,
          this.image,
          this.props.scaleAndPan
        );
      }
    } else if (this.props.imageFileInfo) {
      drawImageOnCanvas(
        this.baseCanvas.canvasContext,
        this.image,
        this.props.scaleAndPan
      );
    }
  };

  private loadImage = () => {
    if (this.props.imgSrc) {
      // Load the image
      this.image = new Image();
      // Prevent SecurityError "Tainted canvases may not be exported." #70
      this.image.crossOrigin = "anonymous";
      // Draw the image once loaded
      this.image.onload = () => {
        this.drawImage();
        this.props.updateImageDimensions(
          (this.image as HTMLImageElement).width,
          (this.image as HTMLImageElement).height
        );
      };
      this.image.src = this.props.imgSrc;
    } else if (this.props.imageFileInfo) {
      this.image = this.createCanvasFromArray(
        this.props.imageFileInfo.slicesData[this.props.sliceIndex],
        this.props.imageFileInfo.width,
        this.props.imageFileInfo.height
      );
      this.drawImage();
    }
  };

  private createCanvasFromArray = (
    array: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number
  ): OffscreenCanvas => {
    // Create a canvas element from an array.
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    const imageData = context.createImageData(width, height);

    imageData.data.set(array);
    context.putImageData(imageData, 0, 0);
    return canvas;
  };

  componentDidMount = (): void => {
    this.loadImage();
  };

  componentDidUpdate(): void {
    this.loadImage();
    //this.drawImage();
  }

  render = (): ReactNode => {
    return (
      <BaseCanvas
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
        name="background"
        scaleAndPan={this.props.scaleAndPan}
        zoomExtents={{ min: 0.3, max: 3 }}
        canvasPositionAndSize={this.props.canvasPositionAndSize}
      />
    );
  };
}
