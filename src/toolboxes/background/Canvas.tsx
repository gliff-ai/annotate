import React from "react";
import { Component } from "react";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
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

export class BackgroundCanvas extends Component<Props> {
  private baseCanvas: any;
  private image: HTMLImageElement;

  constructor(props: Props) {
    super(props);
  }

  private redrawImage = () => {
    if (this.image && this.image.complete) {
      drawImageProp({ ctx: this.baseCanvas.canvasContext, img: this.image });
    }
  };

  private drawImage = () => {
    if (!this.props.imgSrc) return;

    // Load the image
    this.image = new Image();

    // Prevent SecurityError "Tainted canvases may not be exported." #70
    this.image.crossOrigin = "anonymous";

    // Draw the image once loaded
    this.image.onload = () => {this.redrawImage; this.props.updateImageDimensions(this.image.width, this.image.height);}
    this.image.src = this.props.imgSrc;

    // //TODO: remove
    // setTimeout(() => {
    //   this.props.updateImageDimensions(this.image.width, this.image.height);
    // }, 5000);
  };

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate(): void {
    this.redrawImage();
  }

  render() {
    return (
      <BaseCanvas
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
        name="background"
        scaleAndPan={this.props.scaleAndPan}
        zoomExtents={{ min: 0.3, max: 3 }}
      />
    );
  }
}
