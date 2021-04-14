import React, { Component, ReactNode, ReactElement } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { imageToCanvas } from "@/transforms";
import drawImageOnCanvas from "./drawImage";

import { useBackgroundStore } from "./Store";

interface Props extends BaseProps {
  imgSrc: string | null;
  setDisplayedImage: (displayedImage: ImageBitmap) => void;
  contrast: number;
  brightness: number;
  channels: boolean[];
}

export class BackgroundCanvasClass extends Component<Props> {
  private baseCanvas: BaseCanvas;

  private image: HTMLImageElement | ImageBitmap;

  componentDidUpdate(prevProps: Props): void {
    // imgSrc is used to avoid calling loadImage when the component mounts
    if (
      !this.props.imgSrc &&
      prevProps.displayedImage !== this.props.displayedImage
    ) {
      this.loadImage(); // calls this.drawImage() after image loading
    } else {
      this.drawImage();
    }
    if (
      prevProps.brightness !== this.props.brightness ||
      prevProps.contrast !== this.props.contrast
    ) {
      this.updateBrightnessOrContrast();
    }

    if (this.props.displayedImage !== undefined) {
      // Update number of channels displayed

      const colour = `#${this.props.channels
        .map((channel: boolean) => (channel ? "FF" : "00"))
        .join("")}FF`;

      const { canvasContext } = this.baseCanvas;
      canvasContext.globalCompositeOperation = "multiply";
      canvasContext.fillStyle = colour;
      const topLeft = imageToCanvas(
        0,
        0,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      );
      const imageScalingFactor = Math.min(
        this.props.canvasPositionAndSize.width /
          this.props.displayedImage.width,
        this.props.canvasPositionAndSize.height /
          this.props.displayedImage.height
      );
      canvasContext.fillRect(
        topLeft.x,
        topLeft.y,
        this.props.displayedImage.width *
          imageScalingFactor *
          this.props.scaleAndPan.scale,
        this.props.displayedImage.height *
          imageScalingFactor *
          this.props.scaleAndPan.scale
      );
    }
  }

  componentDidMount = (): void => {
    this.loadImage();
  };

  private drawImage = () => {
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
    } else {
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
      this.image.onload = async () => {
        this.props.setDisplayedImage(
          await createImageBitmap(
            this.baseCanvas.canvasContext.getImageData(
              0,
              0,
              this.image.width,
              this.image.height
            )
          )
        );
        this.drawImage();
      };
      this.image.src = this.props.imgSrc;
    } else {
      // this.image = this.createCanvasFromImageData();
      this.image = this.props.displayedImage;
      this.drawImage();
    }
  };

  // private createCanvasFromImageData = (): HTMLCanvasElement => {
  //   // Create a canvas element from an array.
  //   const canvas = document.createElement("canvas");
  //   const context = canvas.getContext("2d");
  //   canvas.width = this.props.imageData.width;
  //   canvas.height = this.props.imageData.height;
  //   context.putImageData(this.props.imageData, 0, 0);
  //   return canvas;
  // };

  updateBrightnessOrContrast = (): void => {
    // Update image brightness and contrast
    this.baseCanvas.canvasContext.filter = `contrast(${this.props.contrast}%) brightness(${this.props.brightness}%)`;
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
  props: Omit<Props, "contrast" | "brightness" | "channels">
): ReactElement => {
  const [background] = useBackgroundStore();

  return (
    <BackgroundCanvasClass
      imgSrc={props.imgSrc}
      setDisplayedImage={props.setDisplayedImage}
      contrast={background.contrast}
      brightness={background.brightness}
      channels={background.channels}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
      displayedImage={props.displayedImage}
    />
  );
};
