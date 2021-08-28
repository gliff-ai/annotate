import { Component, ReactElement, MouseEvent } from "react";

import { BaseIconButton } from "@gliff-ai/style";
import { tooltips } from "@/components/tooltips";
import { Submenu } from "./Submenu";

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  activateTool: (activeTool: string) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
  onClose: (event: MouseEvent) => void;
  anchorElement: HTMLButtonElement | null;
  isTyping: () => boolean;
}

const events = ["selectBrush"] as const;

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
      <Submenu
        isOpen={
          this.props.buttonClicked === "Brush" &&
          Boolean(this.props.anchorElement)
        }
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
      />
    </>
  );
}

export { Toolbar };
