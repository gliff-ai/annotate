import React from "react";
import { Component } from "react";

import { Annotations } from "./annotation";

import { BaseButton } from "./components/BaseButton";

import { BackgroundCanvas } from "./toolboxes/background";
import { SplineCanvas } from "./toolboxes/spline";

export class UserInterface extends Component {
  state: {
    x: number;
    y: number;
    scale: number;
    activeTool?: "spline";
    imageScalingFactor: number;
    activeAnnotationID: number;
  };

  annotationsObject: Annotations;
  
  constructor(props: never) {
    super(props);
    this.annotationsObject  = new Annotations();
    this.state = {
      scale: 1,
      x: 0,
      y: 0,
      imageScalingFactor: 0,
      activeTool: null,
      activeAnnotationID: null
    };

  

    this.incrementScale = this.incrementScale.bind(this);
    this.incrementPanX = this.incrementPanX.bind(this);
    this.incrementPanY = this.incrementPanY.bind(this);
    this.toggleSpline = this.toggleSpline.bind(this);
    this.updateImageScalingFactor = this.updateImageScalingFactor.bind(this);
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

  updateImageScalingFactor(ratio: number) {
    this.setState({ imageScalingFactor: ratio });
  }

  toggleSpline() {
    if (this.state.activeTool === "spline") {
      this.setState({ activeTool: null });
    } else {
      this.setState({ activeTool: "spline" });
    }
  }

   addAnnotation() {
    this.annotationsObject.addAnnotation(this.state.activeTool)
    this.setState({activeAnnotationID: this.annotationsObject.getActiveAnnotationID()})
  }

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
          updateImageScalingFactor={this.updateImageScalingFactor}
        />

        

        <SplineCanvas
          scaleAndPan={this.state}
          isActive={this.state.activeTool === "spline"}
          annotationData={this.annotationsObject}
        />
      </div>
    );
  }
}
