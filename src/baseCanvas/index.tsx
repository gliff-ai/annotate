import React from "react";
import { Component, ReactNode } from "react";
import { XYPoint } from "../annotation/interfaces";


export interface Props {
  name?: string;
  zoomExtents?: {
    min: number;
    max: number;
  };
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  };
  cursor?: "crosshair" | "none";
  onClick?: (arg0: number, arg1: number) => void;
  onDoubleClick?: (arg0: number, arg1: number) => void;
}
export class BaseCanvas extends Component<Props> {
  private name: string;
  private canvas: HTMLCanvasElement;
  private canvasContainer: HTMLDivElement;

  private canvasContext: CanvasRenderingContext2D;
  private canvasObserver: ResizeObserver;

  private scaleAndPan: any;

  constructor(props: Props) {
    super(props);
    this.name = props.name;

    this.scaleAndPan = props.scaleAndPan;
  }



  private clearWindow = (): void => {
    this.canvasContext.save();
    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0); // identity matrix

    try {
      this.canvasContext.clearRect(
        0,
        0,
        this.canvasContext.canvas.width,
        this.canvasContext.canvas.height
      );
    } 
    finally {
        this.canvasContext.restore();
      }
  };

  componentDidUpdate() {
    this.applyView();
  }

  private applyView = (): void => {
    this.clearWindow();
    this.canvasContext.setTransform(
      this.props.scaleAndPan.scale,
      0,
      0,
      this.props.scaleAndPan.scale,
      this.props.scaleAndPan.x,
      this.props.scaleAndPan.y
    );
  };

  private handleCanvasResize = (entries: ResizeObserverEntry[]): void => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      this.setCanvasSize(width, height);
      console.log(width, height)
    }

    this.canvasContext.beginPath();
    this.canvasContext.arc(100, 75, 50, 0, 2 * Math.PI);
    this.canvasContext.stroke();
  };

  private setCanvasSize = (width: number, height: number): void => {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  };

  componentDidMount = (): void => {
    this.canvasObserver = new ResizeObserver((entries: ResizeObserverEntry[]) =>
      this.handleCanvasResize(entries)
    );

    this.canvasObserver.observe(this.canvasContainer);
  };

  componentWillUnmount = (): void => {
    this.canvasObserver.unobserve(this.canvasContainer);
  };

  onClickHandler = (e: React.MouseEvent): void => {
    // x and y start out in window space

    let rect = this.canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // x and y are now in canvas space

    if (this.props.onClick) {
      this.props.onClick(x, y);
    }
  };

  onDoubleClickHandler = (e: React.MouseEvent): void => {
    // x and y start out in window space

    let rect = this.canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // x and y are now in canvas space

    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(x, y);
    }
  };

  render = (): ReactNode => {
    return (
      <div
        ref={(canvasContainer) => (this.canvasContainer = canvasContainer)}
        style={{
          display: "block",
          touchAction: "none",
          maxWidth: "100%",
          maxHeight: "100%",
          width: 400,
          height: 400,
          zIndex: 100,
          top: "150px",
          position: "absolute",
          cursor: this.props.cursor || "none",
          border: "1px solid red",
        }}
      >
        <canvas
          onClick={this.onClickHandler}
          onDoubleClick={this.onDoubleClickHandler}
          key={this.name}
          id={`${this.name}-canvas`}
          ref={(canvas) => {
            if (canvas) {
              // Keep this as it is initially null
              this.canvas = canvas;
              this.canvasContext = canvas.getContext("2d");
            }
          }}
        ></canvas>
      </div>
    );
  };
}

export function canvasToImage(canvasX: number, canvasY: number, imageWidth: number, imageHeight:number, scaleAndPan:any) {
  let { x: translateX, y: translateY, scale:scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html


  // transform from canvas space to original canvas space:
  let x = (canvasX-translateX) / scale;
  let y = (canvasY-translateY) / scale;

  // original canvas to image transform:
  x = (x / 400) * Math.min(imageWidth, imageHeight);
  y = (y / 400) * Math.min(imageWidth, imageHeight);

  if (imageWidth > imageHeight) {
    x += (imageWidth - imageHeight) / 2;
  }
  else if (imageHeight > imageWidth) {
    y += (imageHeight - imageWidth) / 2;
  }

  return {x: x, y: y}
}

export function imageToCanvas(imageX: number, imageY: number, imageWidth: number, imageHeight:number, scaleAndPan:any) {
  let { x: translateX, y: translateY, scale:scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  let x = imageX, y = imageY;

  console.log("Beginning imageToCanvas")

  console.log(x, y) // image space

  if (imageWidth > imageHeight) {
    x -= (imageWidth - imageHeight) / 2;
  }
  else if (imageHeight > imageWidth) {
    y -= (imageHeight - imageWidth) / 2;
  }

  console.log(x, y) // largest central square image space

  x = 400 * x / Math.min(imageWidth, imageHeight);
  y = 400 * y / Math.min(imageWidth, imageHeight);

  console.log(x, y) // original canvas space

  x = x * scale + translateX;
  y = y * scale + translateY;

  console.log(x, y) // canvas space

  return {x: x, y: y}
}

export function imageToOriginalCanvas(imageX: number, imageY: number, imageWidth: number, imageHeight:number, scaleAndPan:any) {
  let { x: translateX, y: translateY, scale:scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  let x = imageX, y = imageY;

  console.log("Beginning imageToCanvas")

  console.log(x, y) // image space

  if (imageWidth > imageHeight) {
    x -= (imageWidth - imageHeight) / 2;
  }
  else if (imageHeight > imageWidth) {
    y -= (imageHeight - imageWidth) / 2;
  }

  console.log(x, y) // largest central square image space

  x = 400 * x / Math.min(imageWidth, imageHeight);
  y = 400 * y / Math.min(imageWidth, imageHeight);

  console.log(x, y) // original canvas space

  return {x: x, y: y}
}