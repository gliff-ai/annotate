import React from "React";
import { Component } from "React";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
import drawImageProp from "./drawImage";

interface Props extends BaseProps {
  imgSrc?: string;
}

interface State {
  brightness: number;
  contrast: number;
}

export class BackgroundCanvas extends Component<Props> {
  private baseCanvas: any;
  // private canvasContainer: HTMLDivElement;

  // private canvasContext: CanvasRenderingContext2D;
  // private canvasObserver: ResizeObserver;

  // private coordSystem: CoordinateSystem;

  // private zoomExtents: Extents;

  private image: HTMLImageElement;

  constructor(props: Props) {
    super(props);
  }

  private redrawImage = () => {
    this.image && this.image.complete && drawImageProp({ ctx: this.baseCanvas.canvasContext, img: this.image });
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
    console.log("Mounted background");
    console.log(this.baseCanvas);
    console.log(this.baseCanvas?.canvas);
    this.drawImage();
  };

  render() {
    return (
      <BaseCanvas
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
        name="background"
        zoomExtents={{ min: 0.3, max: 3 }}
      />
    );
  }
}
