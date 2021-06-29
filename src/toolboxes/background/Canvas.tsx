import React, { Component, ReactNode, ReactElement } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { drawImageOnCanvas, getImageDataFromCanvas } from "./drawImage";

import { useBackgroundStore } from "./Store";

interface Props extends BaseProps {
  contrast: number;
  brightness: number;
  setCanvasContainerColourCallback?: (colour: string) => void;
}

export class BackgroundCanvasClass extends Component<Props> {
  private baseCanvas: BaseCanvas;

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate(prevProps: Props): void {
    if (
      prevProps.brightness !== this.props.brightness ||
      prevProps.contrast !== this.props.contrast ||
      prevProps.canvasPositionAndSize !== this.props.canvasPositionAndSize
    ) {
      this.updateBrightnessOrContrast();
    }
    this.drawImage();
    if (prevProps.displayedImage !== this.props.displayedImage) {
      this.setCanvasContainerColour();
    }
  }

  private drawImage = () => {
    // Any annotation that is already on the canvas is put on top of any new annotation
    if (this.props.displayedImage) {
      this.baseCanvas.canvasContext.globalCompositeOperation =
        "destination-over";
      drawImageOnCanvas(
        this.baseCanvas.canvasContext,
        this.props.displayedImage,
        this.props.scaleAndPan
      );
    }
  };

  setCanvasContainerColour = (): void => {
    // Set background colour of canvas area sorrounding the background image.
    if (
      !this.props.displayedImage ||
      !this.props.setCanvasContainerColourCallback
    )
      return;

    const alpha = 0.8;
    const color = [];

    // Get the data for the background image
    const { width, height, data } = getImageDataFromCanvas(
      this.baseCanvas.canvasContext,
      this.props.displayedImage,
      this.props.scaleAndPan
    );

    const samp = 4;
    // For each RGB value
    for (let i = 0; i < samp; i += 1) {
      // Calculate the mean of the values at the four corners of the image.
      color[i] =
        (data[0 + i] +
          data[(width - 1) * samp + i] +
          data[width * (height - 1) * samp + i] +
          data[data.length - samp + i]) /
        4;
    }

    this.props.setCanvasContainerColourCallback(
      `rgba(${color[0]},${color[1]},${color[2]},${alpha})`
    );
  };

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
      setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
    />
  );
}

export const BackgroundCanvas = (
  props: Omit<Props, "contrast" | "brightness">
): ReactElement => {
  const [background] = useBackgroundStore();

  return (
    <BackgroundCanvasClass
      contrast={background.contrast}
      brightness={background.brightness}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
      displayedImage={props.displayedImage}
      setCanvasPositionAndSize={props.setCanvasPositionAndSize}
      setCanvasContainerColourCallback={props.setCanvasContainerColourCallback}
    />
  );
};
