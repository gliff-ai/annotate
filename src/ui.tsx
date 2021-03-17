import React from "react";
import { Component } from "react";

import { Annotations } from "./annotation";

import { BaseButton } from "./components/BaseButton";

import { BackgroundCanvas } from "./toolboxes/background";
import { SplineCanvas } from "./toolboxes/spline";
import { PaintbrushCanvas } from "./toolboxes/paintbrush";

export class UserInterface extends Component {
  state: {
    x: number;
    y: number;
    scale: number;
    activeTool?: "spline" | "paintbrush";
    imageWidth: number;
    imageHeight: number;
    activeAnnotationID: number;
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

  togglePaintbrush() {
    if (this.state.activeTool === "paintbrush") {
      this.setState({ activeTool: null });
    } else {
      this.setState({ activeTool: "paintbrush" });
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
          name={"spline"}
          onClick={this.toggleSpline}
        />

        <BaseButton
          tooltip={"Activate Paintbrush"}
          icon={"fa-painbrush"}
          name={"paintbrush"}
          onClick={this.togglePaintbrush}
        />

        <BackgroundCanvas
          scaleAndPan={this.state}
          imgSrc="../public/test.png"
          updateImageDimensions={this.updateImageDimensions}
        />

        <SplineCanvas
          scaleAndPan={this.state}
          isActive={this.state.activeTool === "spline"}
          annotationsObject={this.annotationsObject}
          imageWidth={this.state.imageWidth}
          imageHeight={this.state.imageHeight}
        />

        <PaintbrushCanvas
          scaleAndPan={this.state}
          isActive={this.state.activeTool === "paintbrush"}
          annotationsObject={this.annotationsObject}
          imageWidth={this.state.imageWidth}
          imageHeight={this.state.imageHeight}
        />
      </div>
    );
  }
}
