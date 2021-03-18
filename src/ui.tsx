import React from "react";
import { Component } from "react";

import { Annotations } from "./annotation";

import { BaseButton } from "./components/BaseButton";
import { Container, Row, Col, ButtonGroup } from "reactstrap";

import { BackgroundCanvas, BackgroundMinimap } from "./toolboxes/background";
import { SplineCanvas } from "./toolboxes/spline";
import { PaintbrushCanvas } from "./toolboxes/paintbrush";

export class UserInterface extends Component {
  state: {
    scaleAndPan: {
      x: number;
      y: number;
      scale: number;
    };
    activeTool?: "spline" | "paintbrush";
    imageWidth: number;
    imageHeight: number;
    activeAnnotationID: number;

    brushSize: number;

    canvasPositionAndSize: {
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
      brushSize: 20,
      canvasPositionAndSize: { top: 0, left: 0, width: 768, height: 768 },
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

  incrementBrush = () => {
    console.log(this.state.brushSize);
    this.setState({ brushSize: this.state.brushSize + 10 });this
  };

  updateImageDimensions(imageWidth: number, imageHeight: number) {
    this.setState({
      imageWidth: imageWidth,
      imageHeight: imageHeight,
    });
  }

  toggleSpline = () => {
    if (this.state.activeTool === "spline") {
      this.setState({ activeTool: null });
    } else {
      this.setState({ activeTool: "spline" });
    }
  };

  togglePaintbrush = () => {
    if (this.state.activeTool === "paintbrush") {
      this.setState({ activeTool: null });
    } else {
      this.setState({ activeTool: "paintbrush" });
    }
  };

  addAnnotation = () => {
    this.annotationsObject.addAnnotation(this.state.activeTool);
    this.setState({
      activeAnnotationID: this.annotationsObject.getActiveAnnotationID(),
    });
  };

  render() {
    return (
      <Container fluid={true}>
        <Row>
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
          <BaseButton
            tooltip={"increase paintbrush size"}
            icon={"fa-brush"}
            name={"brushradius"}
            onClick={this.incrementBrush}
          />

          <BaseButton
            tooltip={"Activate Paintbrush"}
            icon={"fa-paint-brush"}
            name={"paintbrush"}
            onClick={this.togglePaintbrush}
          />
        </Row>

        <Row>
          <Col md="10">
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
          </Col>

          <Col md="2">
            <Row style={{ height: "200px" }}>
              <BackgroundMinimap
                scaleAndPan={this.state.scaleAndPan}
                setScaleAndPan={this.setScaleAndPan}
                imgSrc="../public/test.png"
                imageWidth={this.state.imageWidth}
                imageHeight={this.state.imageHeight}
                canvasPositionAndSize={this.state.canvasPositionAndSize}
                minimapPositionAndSize={{
                  top: 0,
                  left: 0,
                  width: 200,
                  height: 200,
                }}
              />
            </Row>

            <Row style={{ justifyContent: "center" }}>
              <ButtonGroup>
                <BaseButton
                  tooltip={"zoom out"}
                  icon={"fa-search-minus"}
                  name={"zoomout"}
                  onClick={this.decrementScale}
                />
                <BaseButton
                  tooltip={"reset zoom and pan"}
                  icon={"fa-square"}
                  name={"reset"}
                  onClick={this.resetScaleAndPan}
                />
                <BaseButton
                  tooltip={"zoom in"}
                  icon={"fa-search-plus"}
                  name={"zoomin"}
                  onClick={this.incrementScale}
                />
              </ButtonGroup>

              <ButtonGroup vertical>
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
                </ButtonGroup>
                <ButtonGroup>
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
              </ButtonGroup>
            </Row>
          </Col>
        </Row>
      </Container>
    );
  }
}
