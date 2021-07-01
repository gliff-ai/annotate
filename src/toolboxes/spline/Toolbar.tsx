import React, { Component, ReactElement } from "react";
import { BaseIconButton } from "@/components/BaseIconButton";
import { tooltips } from "@/tooltips";

const events = ["selectSpline", "selectMagicspline"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  activateTool: (activeTool: string) => void;
}

class Toolbar extends Component<Props> {
  componentDidMount = (): void => {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  };

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handleEvent = (event: Event): void => {
    if (event.detail === "spline") {
      this[event.type]?.call(this);
    }
  };

  selectSpline = (): void => {
    this.props.setButtonClicked(tooltips.spline.name);
    this.props.activateTool("spline");
  };

  selectMagicspline = (): void => {
    this.props.setButtonClicked(tooltips.magicspline.name);
    this.props.activateTool("magicspline");
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={tooltips.spline}
        onClick={this.selectSpline}
        fill={this.props.buttonClicked === tooltips.spline.name}
      />
      {/* <BaseIconButton
        tooltip={tooltips.magicspline}
        onClick={this.selectMagicspline}
        fill={this.props.buttonClicked === tooltips.magicspline.name}
      /> */}
    </>
  );
}

export { Toolbar };
