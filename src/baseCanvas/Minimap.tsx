import React from "react";
import { ReactNode } from "react";
import { Props as BaseProps, BaseCanvas } from "./Canvas";
import {
  originalCanvasToMinimap,
  minimapToOriginalCanvas,
} from "../annotation";

export interface Props extends BaseProps {
  cursor?: "move";
  imageWidth: number;
  imageHeight: number;
  canvasPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  minimapPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  setScaleAndPan: (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }) => void;
}

export class BaseMinimap extends React.Component<Props> {
  private baseCanvas: any;
  private boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  constructor(props: Props) {
    super(props);
    this.boundingRect = {
      x: 0,
      y: 0,
      width: this.props.minimapPositionAndSize.width,
      height: this.props.minimapPositionAndSize.height,
    };
  }

  componentDidMount = (): void => {
    this.applyView();
  };

  componentDidUpdate = (): void => {
    this.applyView();
  };

  private applyView = (): void => {
    this.boundingRect = originalCanvasToMinimap(
      this.props.imageWidth,
      this.props.imageHeight,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );
    this.baseCanvas.clearWindow();
    this.baseCanvas.canvasContext.beginPath();
    this.baseCanvas.canvasContext.strokeStyle = "#666666";
    this.baseCanvas.canvasContext.lineWidth = 3;
    this.baseCanvas.canvasContext.strokeRect(
      this.boundingRect.x,
      this.boundingRect.y,
      this.boundingRect.width,
      this.boundingRect.height
    );
  };

  /*** Mouse events ****/
  onDoubleClick = (canvasX: number, canvasY: number): void => {};

  onClick = (canvasX: number, canvasY: number): void => {
    // convert minimap click into viewport coordinate frame
    let { x: viewportX, y: viewportY } = minimapToOriginalCanvas(
      canvasX,
      canvasY,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize,
      this.props.minimapPositionAndSize
    );
    // console.log(
    //   "Translates to viewpoint coordinate x: " + viewportX,
    //   " y: " + viewportY + " when scale is " + this.props.scaleAndPan.scale
    // );

    // calculate top left for zoom centred on these coordinates
    let left =
      viewportX * this.props.scaleAndPan.scale -
      this.props.canvasPositionAndSize.width / 2;
    let top =
      viewportY * this.props.scaleAndPan.scale -
      this.props.canvasPositionAndSize.height / 2;

    // console.log(
    //   "So our box, which is currently " +
    //     this.props.canvasPositionAndSize.width / this.props.scaleAndPan.scale +
    //     " wide and " +
    //     this.props.canvasPositionAndSize.height / this.props.scaleAndPan.scale +
    //     " high should be at left: " +
    //     left +
    //     " and top: " +
    //     top
    // );

    // update scaleAndPan using the method passed down from UI
    this.props.setScaleAndPan({
      scale: this.props.scaleAndPan.scale,
      x: -left,
      y: -top,
    });
  };

  onMouseDown = (canvasX: number, canvasY: number): void => {};

  onMouseMove = (canvasX: number, canvasY: number): void => {};

  onMouseUp = (canvasX: number, canvasY: number): void => {};

  onContextMenu = (canvasX: number, canvasY: number): void => {};

  render = (): ReactNode => {
    return (
      <BaseCanvas
        cursor="move"
        onDoubleClick={this.onDoubleClick}
        onClick={this.onClick}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        onContextMenu={this.onContextMenu}
        name={this.props.name}
        scaleAndPan={{ x: 0, y: 0, scale: 1 }}
        canvasPositionAndSize={this.props.minimapPositionAndSize}
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
      />
    );
  };
}
