import React from "react";
import { Component } from "react";

import { BaseMinimap, MinimapProps as BaseProps } from "../../baseCanvas";
// @ts-ignore
import drawImageProp from "./drawImage";

interface Props extends BaseProps {
  imgSrc?: string;
  updateImageDimensions: (imageWidth: number, imageHeight: number) => void;
}

interface State {
  brightness: number;
  contrast: number;
}

export class BackgroundMinimap extends Component<Props> {
  private baseMinimap: any;
  private image: HTMLImageElement;

  constructor(props: Props) {
    super(props);
  }

  private redrawImage = () => {
    if (this.image && this.image.complete) {
      drawImageProp({
        ctx: this.baseMinimap.baseCanvas.canvasContext,
        img: this.image,
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

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate(): void {
    this.redrawImage();
  }

  render() {
    return (
      <BaseMinimap
        ref={(baseMinimap) => (this.baseMinimap = baseMinimap)}
        name="background-minimap"
        canvasPositionAndSize={this.props.canvasPositionAndSize}
      />
    );
  }
}
