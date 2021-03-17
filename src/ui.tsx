import React from "react";
import { Component } from "react";

import { Annotations } from "./annotation";

import { BaseButton } from "./components/BaseButton";

import { BackgroundCanvas, BackgroundMinimap } from "./toolboxes/background";

export class UserInterface extends Component {
  state: {
    x: number;
    y: number;
    scale: number;
    activeTool?: "spline";
    imageWidth: number;
    imageHeight: number;
    activeAnnotationID: number;
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
  };

  annotationsObject: Annotations;

  constructor(props: never) {
    super(props);
    this.annotationsObject = new Annotations();
    this.state = {
      scale: 1,
      x: 0,
      y: 0,
      imageWidth: 0,
      imageHeight: 0,
      activeTool: null,
      activeAnnotationID: null,
      canvasPositionAndSize: { top: 150, left: 0, width: 400, height: 400 },
      minimapPositionAndSize: { top: 0, left: 450, width: 100, height: 100 },
    };

    this.incrementScale = this.incrementScale.bind(this);
    this.incrementPanX = this.incrementPanX.bind(this);
    this.incrementPanY = this.incrementPanY.bind(this);
    this.toggleSpline = this.toggleSpline.bind(this);
    this.updateImageDimensions = this.updateImageDimensions.bind(this);
  }

  incrementScale() {
    this.setState({ scale: 4 });
  }

  incrementPanX() {
    // negative is left, +ve is right...
    this.setState({ x: this.state.x - 10 });
  }

  incrementPanY() {
    // negative is up, +ve is down...
    this.setState({ y: this.state.y - 10 });
  }

  updateImageDimensions(imageWidth: number, imageHeight: number) {
    this.setState({
      imageWidth: imageWidth,
      imageHeight: imageHeight,
    });
  }

  toggleSpline() {
    if (this.state.activeTool === "spline") {
      this.setState({ activeTool: null });
    } else {
      this.setState({ activeTool: "spline" });
    }
  }

  addAnnotation = () => {
    this.annotationsObject.addAnnotation(this.state.activeTool);
    this.setState({
      activeAnnotationID: this.annotationsObject.getActiveAnnotationID(),
    });
  };

  render() {
    return (
      <div>
        <BaseButton
          tooltip={"ZOOM"}
          icon={"fa-search-plus"}
          name={"zoom"}
          onClick={this.incrementScale}
        />
        <BaseButton
          tooltip={"panX"}
          icon={"fa-chevron-left"}
          name={"panx"}
          onClick={this.incrementPanX}
        />
        <BaseButton
          tooltip={"panY"}
          icon={"fa-chevron-right"}
          name={"pany"}
          onClick={this.incrementPanY}
        />

        <BaseButton
          tooltip={"add new object"}
          icon={"fa-plus"}
          name={"newobject"}
          onClick={this.addAnnotation}
        />

        <BaseButton
          tooltip={"Activate Spline"}
          icon={"fa-bezier-curve"}
          name={"splint"}
          onClick={this.toggleSpline}
        />

        <BackgroundCanvas
          scaleAndPan={this.state}
          imgSrc="../public/test.png"
          updateImageDimensions={this.updateImageDimensions}
          canvasPositionAndSize={this.state.canvasPositionAndSize}
        />

        <SplineCanvas
          scaleAndPan={this.state}
          isActive={this.state.activeTool === "spline"}
          annotationsObject={this.annotationsObject}
          imageWidth={this.state.imageWidth}
          imageHeight={this.state.imageHeight}
          canvasPositionAndSize={this.state.canvasPositionAndSize}
        />

        <BackgroundMinimap
          imgSrc="../public/test.png"
          updateImageDimensions={this.updateImageDimensions}
          canvasPositionAndSize={this.state.minimapPositionAndSize}
        />
      </div>
    );
  }
}
