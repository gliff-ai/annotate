import React, { Component, ReactNode } from "react";

import { BaseMinimap, MinimapProps as BaseProps } from "../../baseToolbox";
import { drawImageOnCanvas } from "./drawImage";

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
}
export class BackgroundMinimap extends Component<Props> {
  private baseMinimap: BaseMinimap;

  private image: HTMLImageElement;

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate = (): void => {
    this.redrawImage();
  };

  private redrawImage = () => {
    this.baseMinimap.baseCanvas.canvasContext.filter = `contrast(${this.props.contrast}%) brightness(${this.props.brightness}%)`;
    this.baseMinimap.baseCanvas.canvasContext.globalCompositeOperation =
      "destination-over";
    if (this.image && this.image.complete) {
      drawImageOnCanvas(this.baseMinimap.baseCanvas.canvasContext, this.image, {
        x: 0,
        y: 0,
        scale: 1,
      });
    } else if (this.props.imageData !== undefined) {
      drawImageOnCanvas(
        this.baseMinimap.baseCanvas.canvasContext,
        this.props.imageData,
        {
          x: 0,
          y: 0,
          scale: 1,
        }
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
    this.image.onload = this.redrawImage;
    this.image.src = this.props.imgSrc;
  };

  render = (): ReactNode => {
    return (
      <BaseMinimap
        scaleAndPan={this.props.scaleAndPan}
        setScaleAndPan={this.props.setScaleAndPan}
        ref={(baseMinimap) => (this.baseMinimap = baseMinimap)}
        name="background-minimap"
        imageData={this.props.imageData}
        canvasPositionAndSize={this.props.canvasPositionAndSize}
        minimapPositionAndSize={this.props.minimapPositionAndSize}
        setMinimapPositionAndSize={this.props.setMinimapPositionAndSize}
      />
    );
  };
}
