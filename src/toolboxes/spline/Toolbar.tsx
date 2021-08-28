import { Component, ReactElement, MouseEvent } from "react";
import { BaseIconButton } from "@gliff-ai/style";
import { tooltips } from "@/components/tooltips";
import { Submenu } from "./Submenu";

const events = ["selectSpline"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

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

class Toolbar extends Component<Props> {
  private refSplinePopover: HTMLButtonElement;

  constructor(props: Props) {
    super(props);
    this.refSplinePopover = null;
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
    if (event.detail === "spline") {
      this[event.type]?.call(this);
    }
  };

  selectSpline = (): void => {
    if (this.props.isTyping()) return;
    this.props.handleOpen()(this.refSplinePopover);
    this.props.setButtonClicked(tooltips.spline.name);
    this.props.activateTool("spline");
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={tooltips.spline}
        onClick={this.selectSpline}
        fill={this.props.buttonClicked === tooltips.spline.name}
        setRefCallback={(ref) => {
          this.refSplinePopover = ref;
        }}
      />
      <Submenu
        isOpen={
          this.props.buttonClicked === "Spline" &&
          Boolean(this.props.anchorElement)
        }
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
      />
    </>
  );
}

export { Toolbar };
