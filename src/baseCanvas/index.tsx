import React from "react";
import { Component, ReactNode } from "react";
import CoordinateSystem, {
  IDENTITY,
  Extents,
  View,
  ClientPoint,
} from "./CoordinateSystem.js";

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
}
export class BaseCanvas extends Component<Props> {
  private name: string;
  private canvas: HTMLCanvasElement;
  private canvasContainer: HTMLDivElement;

  private canvasContext: CanvasRenderingContext2D;
  private canvasObserver: ResizeObserver;

  private coordSystem: CoordinateSystem;

  private zoomExtents: Extents;

  private scaleAndPan: any;

  constructor(props: Props) {
    super(props);
    this.name = props.name;
    this.zoomExtents = props.zoomExtents || { min: 0.3, max: 3 };
    this.coordSystem = new CoordinateSystem({
      scaleExtents: this.zoomExtents,
      documentSize: { width: 400, height: 400 },
    });

    this.scaleAndPan = props.scaleAndPan;
    this.coordSystem.attachViewChangeListener(this.applyView.bind(this));

    this.onClickHandler = this.onClickHandler.bind(this);
  }

  private setView = (view: View) => {
    if (view.scale === 0 && view.x === 0 && view.y) {
      this.coordSystem.resetView();
    } else {
      return this.coordSystem.setView(view);
    }
  };

  private inClientSpace = (action: any) => {
    this.canvasContext.save();
    this.canvasContext.setTransform(
      IDENTITY.a,
      IDENTITY.b,
      IDENTITY.c,
      IDENTITY.d,
      IDENTITY.e,
      IDENTITY.f
    );

    try {
      action();
    } finally {
      this.canvasContext.restore();
    }
  };

  private clearWindow = (): void => {
    this.inClientSpace(() =>
      this.canvasContext.clearRect(
        0,
        0,
        this.canvasContext.canvas.width,
        this.canvasContext.canvas.height
      )
    );
  };

  private applyView = (): void => {
    this.clearWindow();
    const m = this.coordSystem.transformMatrix;
    this.canvasContext.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  };

  private handleCanvasResize = (entries: ResizeObserverEntry[]): void => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      this.setCanvasSize(width, height);
    }

    // this.canvasContext.beginPath();
    // this.canvasContext.arc(100, 75, 50, 0, 2 * Math.PI);
    // this.canvasContext.stroke();
  };

  private setCanvasSize = (width: number, height: number): void => {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  };

  private getContext = (): void => {
    this.canvasContext = this.canvas.getContext("2d");
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

  componentDidUpdate(): void {
    this.coordSystem.scaleExtents = this.zoomExtents;
    this.setView(this.props.scaleAndPan);
  }

  onClickHandler(e: React.MouseEvent): void {
    let rect = this.canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    console.log("Coordinate x: " + x, "Coordinate y: " + y);

    const clientPoint: ClientPoint = { clientX: x, clientY: y };

    const {
      x: viewpointX,
      y: viewpointY,
    } = this.coordSystem.clientPointToViewPoint(
      clientPoint,
      this.props.scaleAndPan
    );

    console.log(
      "Coordinate view x: " + viewpointX,
      "Coordinate view y: " + viewpointY
    );

    if (this.props.onClick) {
      this.props.onClick(viewpointX, viewpointY);
    }
  }

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
