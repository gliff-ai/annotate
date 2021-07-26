import { Component, ReactNode, ReactElement } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { drawImageOnCanvas, getImageDataFromCanvas } from "./drawImage";

import { useBackgroundStore } from "./Store";

interface Props extends BaseProps {
  contrast: number;
  brightness: number;
  setCanvasContainerColourCallback?: (colour: number[]) => void;
}
interface State {
  edgeColour: string | null;
}
export class CanvasClass extends Component<Props, State> {
  private baseCanvas: BaseCanvas;

  constructor(props: Props) {
    super(props);
    this.state = {
      edgeColour: null,
    };
  }

  componentDidMount = (): void => {
    this.drawImage();
  };

  componentDidUpdate(prevProps: Props): void {
    if (
      prevProps.brightness !== this.props.brightness ||
      prevProps.contrast !== this.props.contrast ||
      prevProps.canvasPositionAndSize !== this.props.canvasPositionAndSize
    ) {
      this.updateBrightnessOrContrast();
    }
    this.drawImage();

    if (prevProps.displayedImage !== this.props.displayedImage) {
      this.setCanvasContainerColour();
    }
  }

  private drawImage = () => {
    // Any annotation that is already on the canvas is put on top of any new annotation
    if (this.props.displayedImage) {
      this.baseCanvas.canvasContext.globalCompositeOperation =
        "destination-over";
      drawImageOnCanvas(
        this.baseCanvas.canvasContext,
        this.props.displayedImage,
        this.props.scaleAndPan,
        this.state.edgeColour
      );
    }
  };

  setEdgeColour = (containerColour: number[]): void => {
    const [r, g, b] = containerColour;
    const colour = 255 - (r + g + b) / 3; // Get the inverse colour to the container colour and average it to grey (so R=B=G).
    // Set edge colour
    this.setState({
      edgeColour: `rgba(${colour},${colour},${colour},0.75)`,
    });
  };

  setCanvasContainerColour = (): void => {
    // Set background colour of canvas area sorrounding the background image.
    if (
      !this.props.displayedImage ||
      !this.props.setCanvasContainerColourCallback
    )
      return;

    // Get the data for the background image
    const { width, height, data } = getImageDataFromCanvas(
      this.baseCanvas.canvasContext,
      this.props.displayedImage,
      this.props.scaleAndPan
    );

    const colour = [];
    const samp = 4;
    // For each RGB value
    for (let i = 0; i < 3; i += 1) {
      // Calculate the mean of the values at the four corners of the image.
      colour[i] =
        (data[0 + i] +
          data[(width - 1) * samp + i] +
          data[width * (height - 1) * samp + i] +
          data[data.length - samp + i]) /
        4;
    }
    colour[3] = 1;

    // Set canvas container colour
    this.props.setCanvasContainerColourCallback(colour);

    // Set edge colour
    this.setEdgeColour(colour);
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
      setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
    />
  );
}

export const Canvas = (
  props: Omit<Props, "contrast" | "brightness">
): ReactElement => {
  const [background] = useBackgroundStore();

  return (
    <CanvasClass
      contrast={background.contrast}
      brightness={background.brightness}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
      displayedImage={props.displayedImage}
      setCanvasPositionAndSize={props.setCanvasPositionAndSize}
      setCanvasContainerColourCallback={props.setCanvasContainerColourCallback}
    />
  );
};
