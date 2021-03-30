import React, { Component, ReactNode } from "react";

import { XYPoint } from "@/annotation/interfaces";

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
  cursor?: "crosshair" | "move" | "pointer" | "none" | "not-allowed";
  onDoubleClick?: (x: number, y: number) => void;
  onClick?: (x: number, y: number) => void;
  onMouseDown?: (x: number, y: number) => void;
  onMouseMove?: (x: number, y: number) => void;
  onMouseUp?: (x: number, y: number) => void;
  onContextMenu?: (x: number, y: number) => void;
  canvasPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  setCanvasPositionAndSize?: (canvasPositionAndSize: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  }) => void;
  imageData?: ImageData;
}
export class BaseCanvas extends Component<Props> {
  private name: string;

  private canvas: HTMLCanvasElement;

  private canvasContainer: HTMLDivElement;

  public canvasContext: CanvasRenderingContext2D;

  private canvasObserver: ResizeObserver;

  constructor(props: Props) {
    super(props);
    this.name = props.name;
  }

  public clearWindow = (): void => {
    this.canvasContext.save();
    // this.canvasContext.setTransform(1, 0, 0, 1, 0, 0); // identity matrix

    try {
      this.canvasContext.clearRect(
        0,
        0,
        this.canvasContext.canvas.width,
        this.canvasContext.canvas.height
      );
    } finally {
      this.canvasContext.restore();
    }
  };

  componentDidUpdate = (): void => {
    this.applyView();
  };

  private applyView = (): void => {
    this.clearWindow();
    // this.canvasContext.setTransform(
    //   this.props.scaleAndPan.scale,
    //   0,
    //   0,
    //   this.props.scaleAndPan.scale,
    //   this.props.scaleAndPan.x,
    //   this.props.scaleAndPan.y
    // );
  };

  private handleCanvasResize = (entries: ResizeObserverEntry[]): void => {
    entries.forEach(({ contentRect: { width, height } }) => {
      this.setCanvasSize(width, height);
    });
  };

  private setCanvasSize = (width: number, height: number): void => {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.props?.setCanvasPositionAndSize?.({ width, height });
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

  windowToCanvas = (e: React.MouseEvent): XYPoint => {
    // returns the mouse coordinates from e, transformed from window to canvas space
    const x = e.clientX - this.canvas.getBoundingClientRect().left;
    const y = e.clientY - this.canvas.getBoundingClientRect().top;

    return { x, y };
  };

  onDoubleClickHandler = (e: React.MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(x, y);
    }
  };

  onClickHandler = (e: React.MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onClick) {
      this.props.onClick(x, y);
    }
  };

  onMouseDownHandler = (e: React.MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onMouseDown) {
      this.props.onMouseDown(x, y);
    }
  };

  onMouseMoveHandler = (e: React.MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onMouseMove) {
      this.props.onMouseMove(x, y);
    }
  };

  onMouseUpHandler = (e: React.MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onMouseUp) {
      this.props.onMouseUp(x, y);
    }
  };

  onContextMenuHandler = (e: React.MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    // x and y are now in canvas space
    if (this.props.onContextMenu) {
      this.props.onContextMenu(x, y);
    }
  };

  render = (): ReactNode => (
    <div
      ref={(canvasContainer) => {
        this.canvasContainer = canvasContainer;
      }}
      style={{
        pointerEvents: "inherit",
        display: "block",
        touchAction: "none",
        width: "100%",
        height: this.props.canvasPositionAndSize.height,
        zIndex: 100,
        cursor: this.props.cursor || "pointer",
        //   border: "1px solid gray",
        top: this.props.canvasPositionAndSize.top,
        left: this.props.canvasPositionAndSize.left,
        position: "absolute",
      }}
    >
      <canvas
        style={{ pointerEvents: "inherit" }}
        width="100%"
        height={this.props.canvasPositionAndSize.height}
        onClick={this.onClickHandler}
        onMouseDown={this.onMouseDownHandler}
        onMouseMove={this.onMouseMoveHandler}
        onMouseUp={this.onMouseUpHandler}
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
      />
    </div>
  );
}
