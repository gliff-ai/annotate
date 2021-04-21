import React, { Component, ReactNode, ReactElement } from "react";

import {
  BaseMinimap,
  MinimapProps as BaseProps,
  PositionAndSize,
} from "@/baseCanvas";
import drawImageOnCanvas from "./drawImage";
import { useBackgroundStore } from "./Store";

interface Props extends BaseProps {
  setMinimapPositionAndSize?: (minimapPositionAndSize: PositionAndSize) => void;
  contrast: number;
  brightness: number;
}

export class BackgroundMinimapClass extends Component<Props> {
  private baseMinimap: BaseMinimap;

  private image: HTMLImageElement | ImageBitmap;

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate(prevProps: Props): void {
    this.drawImage();
    if (
      prevProps.brightness !== this.props.brightness ||
      prevProps.contrast !== this.props.contrast
    ) {
      this.updateBrightnessOrContrast();
    }
  }

  updateBrightnessOrContrast = (): void => {
    this.baseMinimap.baseCanvas.canvasContext.filter = `contrast(${this.props.contrast}%) brightness(${this.props.brightness}%)`;
  };

  private drawImage = () => {
    if (this.props.displayedImage) {
      // Any annotation that is already on the canvas is put on top of any new annotation
      this.baseMinimap.baseCanvas.canvasContext.globalCompositeOperation =
        "destination-over";

      drawImageOnCanvas(
        this.baseMinimap.baseCanvas.canvasContext,
        this.props.displayedImage,
        {
          x: 0,
          y: 0,
          scale: 1,
        }
      );
    }
  };

  render = (): ReactNode => (
    <BaseMinimap
      scaleAndPan={this.props.scaleAndPan}
      setScaleAndPan={this.props.setScaleAndPan}
      ref={(baseMinimap) => {
        this.baseMinimap = baseMinimap;
      }}
      name="background-minimap"
      displayedImage={this.props.displayedImage}
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
      canvasPositionAndSize={props.canvasPositionAndSize}
      minimapPositionAndSize={props.minimapPositionAndSize}
      setScaleAndPan={props.setScaleAndPan}
      scaleAndPan={props.scaleAndPan}
      displayedImage={props.displayedImage}
    />
  );
};
