import React, { Component, ReactNode } from "react";

import { BaseMinimap, MinimapProps as BaseProps } from "../../baseCanvas";
import drawImageOnCanvas from "./drawImage";
import ImageFileInfo from "../../ImageFileInfo";

interface Props extends BaseProps {
  imgSrc?: string;
  setMinimapPositionAndSize?: (minimapPositionAndSize: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  }) => void;
  contrast: number;
  brightness: number;
  imageFileInfo: ImageFileInfo;
  sliceIndex: number;
}
export class BackgroundMinimap extends Component<Props> {
  private baseMinimap: BaseMinimap;
  private image: HTMLImageElement | HTMLCanvasElement;

  private drawImage = () => {
    // Any annotation that is already on the canvas is put on top of any new annotation
    this.baseMinimap.baseCanvas.canvasContext.globalCompositeOperation =
      "destination-over";

    if (this.props.imgSrc) {
      if (this.image && (this.image as HTMLImageElement).complete) {
        drawImageOnCanvas(
          this.baseMinimap.baseCanvas.canvasContext,
          this.image,
          {
            x: 0,
            y: 0,
            scale: 1,
          }
        );
      }
    } else if (this.props.imageFileInfo) {
      drawImageOnCanvas(this.baseMinimap.baseCanvas.canvasContext, this.image, {
        x: 0,
        y: 0,
        scale: 1,
      });
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

  updateBrightnessOrContrast = () => {
    this.baseMinimap.baseCanvas.canvasContext.filter = `contrast(${this.props.contrast}%) brightness(${this.props.brightness}%)`;
  };

  private createCanvasFromArray = (
    array: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number
  ): HTMLCanvasElement => {
    // Create a canvas element from an array.
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    const imageData = context.createImageData(width, height);

    imageData.data.set(array);
    context.putImageData(imageData, 0, 0);
    return canvas;
  };

  componentDidMount = (): void => {
    this.loadImage();
  };

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.imageFileInfo != this.props.imageFileInfo) {
      this.loadImage(); // calls this.drawImage() after image loading
    } else {
      this.drawImage();
    }
    if (
      prevProps.brightness != this.props.brightness ||
      prevProps.contrast != this.props.contrast
    ) {
      this.updateBrightnessOrContrast();
    }
  }

  render = (): ReactNode => {
    return (
      <BaseMinimap
        scaleAndPan={this.props.scaleAndPan}
        setScaleAndPan={this.props.setScaleAndPan}
        ref={(baseMinimap) => (this.baseMinimap = baseMinimap)}
        name="background-minimap"
        imageWidth={this.props.imageWidth}
        imageHeight={this.props.imageHeight}
        canvasPositionAndSize={this.props.canvasPositionAndSize}
        minimapPositionAndSize={this.props.minimapPositionAndSize}
        setMinimapPositionAndSize={this.props.setMinimapPositionAndSize}
      />
    );
  };
}
