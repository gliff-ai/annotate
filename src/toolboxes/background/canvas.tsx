import React from "React";
import { Component } from "React";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";

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

  constructor(props: Props) {
    super(props);
  }

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
    this.drawImage(this.props.imgSrc);
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
