import React, { Component, ReactNode, ReactElement } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { imageToCanvas } from "@/transforms";
import drawImageOnCanvas from "./drawImage";

import { useBackgroundStore } from "./Store";

interface Props extends BaseProps {
  imgSrc: string | null;
  setDisplayedImage: (displayedImage: ImageBitmap) => void;
  contrast: number;
  brightness: number;
  sliceChannelsImages: Array<ImageBitmap>;
  channels: boolean[];
  setChannels: any;
}

export class BackgroundCanvasClass extends Component<Props> {
  private baseCanvas: BaseCanvas;

  private image: HTMLImageElement | ImageBitmap;

  componentDidUpdate(prevProps: Props): void {
    // imgSrc is used to avoid calling loadImage when the component mounts
    if (
      !this.props.imgSrc &&
      prevProps.displayedImage !== this.props.displayedImage
    ) {
      this.loadImage(); // calls this.drawImage() after image loading
    } else {
      this.drawImage();
    }
    if (
      prevProps.brightness !== this.props.brightness ||
      prevProps.contrast !== this.props.contrast
    ) {
      this.updateBrightnessOrContrast();
    }

    if (prevProps.channels !== this.props.channels) {
      this.drawChannelImages();
    }
  }

  componentDidMount = (): void => {
    this.loadImage();
  };

  private drawImage = () => {
    // Any annotation that is already on the canvas is put on top of any new annotation
    this.baseCanvas.canvasContext.globalCompositeOperation = "destination-over";

    if (this.props.imgSrc) {
      if (this.image && (this.image as HTMLImageElement).complete) {
        drawImageOnCanvas(
          this.baseCanvas.canvasContext,
          this.image,
          this.props.scaleAndPan
        );
      }
    } else {
      this.drawChannelImages();
    }
  };

  private drawChannelImages = () => {
    // Draw all selected channel images on the canvas
    const { canvasContext } = this.baseCanvas;
    canvasContext.globalCompositeOperation = "lighter"; // Where images overlap add colour values

    for (let i = 0; i < this.props.sliceChannelsImages.length; i += 1) {
      if (this.props.channels[i]) {
        drawImageOnCanvas(
          canvasContext,
          this.props.sliceChannelsImages[i],
          this.props.scaleAndPan
        );
      }
    }
  };

  private loadImage = () => {
    if (this.props.imgSrc) {
      // Load the image
      this.image = new Image();
      // Prevent SecurityError "Tainted canvases may not be exported." #70
      this.image.crossOrigin = "anonymous";
      // Draw the image once loaded
      this.image.onload = async () => {
        this.props.setDisplayedImage(
          await createImageBitmap(
            this.baseCanvas.canvasContext.getImageData(
              0,
              0,
              this.image.width,
              this.image.height
            )
          )
        );
        this.drawImage();
      };
      this.image.src = this.props.imgSrc;
    } else {
      this.drawImage();
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
    />
  );
}

export const BackgroundCanvas = (
  props: Omit<Props, "contrast" | "brightness">
): ReactElement => {
  const [background] = useBackgroundStore();

  return (
    <BackgroundCanvasClass
      imgSrc={props.imgSrc}
      setDisplayedImage={props.setDisplayedImage}
      contrast={background.contrast}
      brightness={background.brightness}
      channels={props.channels}
      setChannels={props.setChannels}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
      displayedImage={props.displayedImage}
      sliceChannelsImages={props.sliceChannelsImages}
    />
  );
};
