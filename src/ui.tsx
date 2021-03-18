import React from "react";
import { Component } from "react";

import { Annotations } from "./annotation";

import { BaseButton } from "./components/BaseButton";
import { ButtonToolbar, ButtonGroup } from "reactstrap";

import { BackgroundCanvas, BackgroundMinimap } from "./toolboxes/background";
import { SplineCanvas } from "./toolboxes/spline";

export class UserInterface extends Component {
  state: {
    scaleAndPan: {
      x: number;
      y: number;
      scale: number;
    };
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
      scaleAndPan: {
        scale: 1,
        x: 0,
        y: 0,
      },
      imageWidth: 0,
      imageHeight: 0,
      activeTool: null,
      activeAnnotationID: null,
      canvasPositionAndSize: { top: 150, left: 0, width: 400, height: 400 },
      minimapPositionAndSize: { top: 0, left: 450, width: 200, height: 200 },
    };
    this.updateImageDimensions = this.updateImageDimensions.bind(this);
  }

  setScaleAndPan = (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }): void => {
    // the is for passing down to the minimap
    if (scaleAndPan.scale === undefined) {
      scaleAndPan.scale = this.state.scaleAndPan.scale;
    }
    if (scaleAndPan.x === undefined) {
      scaleAndPan.x = this.state.scaleAndPan.x;
    }
    if (scaleAndPan.y === undefined) {
      scaleAndPan.y = this.state.scaleAndPan.y;
    }
    this.setState({ scaleAndPan: scaleAndPan });
  };

  resetScaleAndPan = (): void => {
    this.setScaleAndPan({ scale: 1, x: 0, y: 0 });
  };

  incrementScale = (): void => {
    this.setScaleAndPan({ scale: this.state.scaleAndPan.scale + 1 });
  };

  decrementScale = (): void => {
    this.setScaleAndPan({ scale: this.state.scaleAndPan.scale + -1 });
  };

  incrementPanX = (): void => {
    // negative is left, +ve is right...
    this.setScaleAndPan({ x: this.state.scaleAndPan.x - 10 });
  };

  decrementPanX = (): void => {
    // negative is left, +ve is right...
    this.setScaleAndPan({ x: this.state.scaleAndPan.x + 10 });
  };

  incrementPanY = (): void => {
    // negative is up, +ve is down...
    this.setScaleAndPan({ y: this.state.scaleAndPan.y - 10 });
  };

  decrementPanY = (): void => {
    // negative is up, +ve is down...
    this.setScaleAndPan({ y: this.state.scaleAndPan.y + 10 });
  };

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
        <ButtonToolbar>
          <ButtonGroup>
            <BaseButton
              tooltip={"zoom in"}
              icon={"fa-search-plus"}
              name={"zoomin"}
              onClick={this.incrementScale}
            />
            <BaseButton
              tooltip={"reset zoom and pan"}
              icon={"fa-square"}
              name={"reset"}
              onClick={this.resetScaleAndPan}
            />
            <BaseButton
              tooltip={"zoom out"}
              icon={"fa-search-minus"}
              name={"zoomout"}
              onClick={this.decrementScale}
            />
          </ButtonGroup>

          <ButtonGroup>
            <BaseButton
              tooltip={"pan left"}
              icon={"fa-chevron-left"}
              name={"panxleft"}
              onClick={this.incrementPanX}
            />
            <BaseButton
              tooltip={"pan right"}
              icon={"fa-chevron-right"}
              name={"panxright"}
              onClick={this.decrementPanX}
            />
            <BaseButton
              tooltip={"pan up"}
              icon={"fa-chevron-up"}
              name={"panyup"}
              onClick={this.incrementPanY}
            />
            <BaseButton
              tooltip={"pan down"}
              icon={"fa-chevron-down"}
              name={"panydown"}
              onClick={this.decrementPanY}
            />
          </ButtonGroup>

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
        </ButtonToolbar>

        <BackgroundCanvas
          scaleAndPan={this.state.scaleAndPan}
          imgSrc="../public/test.png"
          updateImageDimensions={this.updateImageDimensions}
          canvasPositionAndSize={this.state.canvasPositionAndSize}
        />

        <SplineCanvas
          scaleAndPan={this.state.scaleAndPan}
          isActive={this.state.activeTool === "spline"}
          annotationsObject={this.annotationsObject}
          imageWidth={this.state.imageWidth}
          imageHeight={this.state.imageHeight}
          canvasPositionAndSize={this.state.canvasPositionAndSize}
        />

        <BackgroundMinimap
          scaleAndPan={this.state.scaleAndPan}
          setScaleAndPan={this.setScaleAndPan}
          imgSrc="../public/test.png"
          imageWidth={this.state.imageWidth}
          imageHeight={this.state.imageHeight}
          canvasPositionAndSize={this.state.canvasPositionAndSize}
          minimapPositionAndSize={{
            top: 0,
            left: 450,
            width: 200,
            height: 200,
          }}
        />
      </div>
    );
  }
}
