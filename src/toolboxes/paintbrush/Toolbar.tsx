import React, { Component, ReactElement } from "react";
import { BaseIconButton } from "@/components/BaseIconButton";
import { tooltips } from "@/components/tooltips";

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  activateTool: (activeTool: string) => void;
  handleOpen: (
    event?: React.MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
  isTyping: () => boolean;
}

const events = ["selectBrush", "selectEraser"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

class Toolbar extends Component<Props> {
  private refBrushPopover: HTMLButtonElement;

  constructor(props: Props) {
    super(props);
    this.refBrushPopover = null;
  }

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
    if (event.detail === "paintbrush") {
      this[event.type]?.call(this);
    }
  };

  selectBrush = (): void => {
    if (this.props.isTyping()) return;
    this.props.handleOpen()(this.refBrushPopover);
    this.props.setButtonClicked(tooltips.paintbrush.name);
    this.props.activateTool("paintbrush");
  };

  selectEraser = (): void => {
    if (this.props.isTyping()) return;
    this.props.setButtonClicked(tooltips.eraser.name);
    this.props.activateTool("eraser");
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={tooltips.paintbrush}
        onClick={this.selectBrush}
        fill={this.props.buttonClicked === tooltips.paintbrush.name}
        setRefCallback={(ref) => {
          this.refBrushPopover = ref;
        }}
      />
      <BaseIconButton
        tooltip={tooltips.eraser}
        onClick={this.selectEraser}
        fill={this.props.buttonClicked === tooltips.eraser.name}
      />
    </>
  );
}

export { Toolbar };
