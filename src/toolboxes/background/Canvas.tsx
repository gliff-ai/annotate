import React, { Component, ReactNode, ReactElement } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import drawImageOnCanvas from "./drawImage";

import { useBackgroundStore } from "./Store";

interface Props extends BaseProps {
  contrast: number;
  brightness: number;
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
    />
  );
};
