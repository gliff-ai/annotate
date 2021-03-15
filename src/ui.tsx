import React from "React";
import { Component } from "React";
import { BackgroundCanvas } from "./toolboxes/background/canvas";
import { BaseButton } from "./components/BaseButton";

export class UserInterface extends Component {
  state: {
    x: number;
    y: number;
    scale: number;
  };

  constructor(props: never) {
    super(props);
    this.state = { scale: 1, x: 1, y: 1 };
    this.incrementScale = this.incrementScale.bind(this);
    this.incrementPanX = this.incrementPanX.bind(this);
    this.incrementPanY = this.incrementPanY.bind(this);
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

  render() {
    return (
      <div>
        <BaseButton
          tooltip={"ZOOM"}
          icon={"fa-zoom"}
          name={"zoom"}
          onClick={this.incrementScale}
        />
        <BaseButton
          tooltip={"panX"}
          icon={"fa-download"}
          name={"panx"}
          onClick={this.incrementPanX}
        />
        <BaseButton
          tooltip={"panY"}
          icon={"fa-download"}
          name={"pany"}
          onClick={this.incrementPanY}
        />
        <BackgroundCanvas
          name="cccc"
          zoomExtents={{ min: 0.33, max: 3 }}
          scaleAndPan={this.state}
          imgSrc="../public/test.png"
        />
      </div>
    );
  }
}
