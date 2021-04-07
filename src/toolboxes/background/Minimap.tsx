import React, { Component, ReactNode, ReactElement } from "react";

import {
  BaseMinimap,
  MinimapProps as BaseProps,
  PositionAndSize,
} from "@/baseCanvas";
import drawImageOnCanvas from "./drawImage";
import { useBackgroundStore } from "./Store";

interface Props extends BaseProps {
  imgSrc?: string;
  setMinimapPositionAndSize?: (minimapPositionAndSize: PositionAndSize) => void;
  contrast: number;
  brightness: number;
}

export class BackgroundMinimapClass extends Component<Props> {
  private baseMinimap: BaseMinimap;

  private image: HTMLImageElement | HTMLCanvasElement;

  componentDidMount = (): void => {
    this.loadImage();
  };

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.imageData !== this.props.imageData) {
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
  }

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
    } else {
      this.image = this.createCanvasFromImageData();
      this.drawImage();
    }
  };

  updateBrightnessOrContrast = (): void => {
    this.baseMinimap.baseCanvas.canvasContext.filter = `contrast(${this.props.contrast}%) brightness(${this.props.brightness}%)`;
  };

  private createCanvasFromImageData = (): HTMLCanvasElement => {
    // Create a canvas element from an array.
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = this.props.imageData.width;
    canvas.height = this.props.imageData.height;
    context.putImageData(this.props.imageData, 0, 0);
    return canvas;
  };

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
    } else {
      drawImageOnCanvas(this.baseMinimap.baseCanvas.canvasContext, this.image, {
        x: 0,
        y: 0,
        scale: 1,
      });
    }
  };

  render = (): ReactNode => (
    <BaseMinimap
      scaleAndPan={this.props.scaleAndPan}
      setScaleAndPan={this.props.setScaleAndPan}
      ref={(baseMinimap) => {
        this.baseMinimap = baseMinimap;
      }}
      name="background-minimap"
      imageData={this.props.imageData}
      canvasPositionAndSize={this.props.canvasPositionAndSize}
      minimapPositionAndSize={this.props.minimapPositionAndSize}
      setMinimapPositionAndSize={this.props.setMinimapPositionAndSize}
    />
  );
}

export const BackgroundMinimap = (
  props: Omit<Props, "contrast" | "brightness">
): ReactElement => {
  const [background] = useBackgroundStore();

  return (
    <BackgroundMinimapClass
      contrast={background.contrast}
      brightness={background.brightness}
      imgSrc={props.imgSrc}
      canvasPositionAndSize={props.canvasPositionAndSize}
      minimapPositionAndSize={props.minimapPositionAndSize}
      setScaleAndPan={props.setScaleAndPan}
      scaleAndPan={props.scaleAndPan}
      imageData={props.imageData}
    />
  );
};
