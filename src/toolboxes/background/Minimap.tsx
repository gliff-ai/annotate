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

  private image: HTMLImageElement;

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate = (): void => {
    this.redrawImage();
  };

  private redrawImage = () => {
    if (this.image && this.image.complete) {
      this.baseMinimap.baseCanvas.canvasContext.filter = `contrast(${this.props.contrast}%) brightness(${this.props.brightness}%)`;
      this.baseMinimap.baseCanvas.canvasContext.globalCompositeOperation =
        "destination-over";
      drawImageOnCanvas(this.baseMinimap.baseCanvas.canvasContext, this.image, {
        x: 0,
        y: 0,
        scale: 1,
      });
    }
  };

  private drawImage = () => {
    if (!this.props.imgSrc) return;

    // Load the image
    this.image = new Image();

    // Prevent SecurityError "Tainted canvases may not be exported." #70
    this.image.crossOrigin = "anonymous";

    // Draw the image once loaded
    this.image.onload = this.redrawImage;
    this.image.src = this.props.imgSrc;
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
      imageData={props.imageData}
      canvasPositionAndSize={props.canvasPositionAndSize}
      minimapPositionAndSize={props.minimapPositionAndSize}
      setScaleAndPan={props.setScaleAndPan}
      scaleAndPan={props.scaleAndPan}
    />
  );
};
