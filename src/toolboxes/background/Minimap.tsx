import React from "react";
import { Component, ReactNode } from "react";

import { BaseMinimap, MinimapProps as BaseProps } from "../../baseCanvas";
import drawImageOnCanvas from "./drawImage";

interface Props extends BaseProps {
  imgSrc?: string;
}

// TODO add brightness and contrast to props not state
// interface State {
//   brightness: number;
//   contrast: number;
// }

export class BackgroundMinimap extends Component<Props> {
  private baseMinimap: BaseMinimap;
  private image: HTMLImageElement;

  constructor(props: Props) {
    super(props);
  }

  private redrawImage = () => {
    if (this.image && this.image.complete) {
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

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate(): void {
    this.redrawImage();
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
      />
    );
  };
}
