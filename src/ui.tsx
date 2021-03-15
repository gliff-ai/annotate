import React from "React";
import { Component } from "React";
import { BackgroundCanvas } from "./toolboxes/background/canvas";

export class UserInterface extends Component {
  // scale: {
  //   x: number;
  //   y: number;
  //   scale: number;
  // };

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
        <div
          style={{ background: "blue", cursor: "pointer" }}
          onClick={this.incrementScale}
        >
          CLICK THIS
        </div>
        <div
          style={{ background: "green", cursor: "pointer" }}
          onClick={this.incrementPanX}
        >
          CLICK THIS
        </div>
        <div
          style={{ background: "orange", cursor: "pointer" }}
          onClick={this.incrementPanY}
        >
          CLICK THIS
        </div>
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
