import React from "react";
import { Component } from "react";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
// @ts-ignore
import drawImageProp from "./drawImage";

interface Props extends BaseProps {
  imgSrc?: string;
  updateImageScalingFactor: (arg0: number) => void;
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
    this.image.onload = this.redrawImage;
    this.image.src = this.props.imgSrc;

    setTimeout(() => {
      const ratio = Math.min(
        this.baseCanvas.canvas.width / this.image.width,
        this.baseCanvas.canvas.height / this.image.height
      );

      console.log(`Ratio: ${ratio}`);
      this.props.updateImageScalingFactor(ratio);
    }, 5000);
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
