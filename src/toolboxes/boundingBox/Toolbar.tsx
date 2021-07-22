import { Component, ReactElement } from "react";
import { BaseIconButton } from "@/components/BaseIconButton";
import { tooltips } from "@/components/tooltips";

const events = ["selectBoundingBox"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  activateTool: (activeTool: string) => void;
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
    if (event.detail === tooltips.boundingBox.name) {
      this[event.type]?.call(this);
    }
  };

  selectBoundingBox = (): void => {
    if (this.props.isTyping()) return;
    this.props.setButtonClicked(tooltips.boundingBox.name);
    this.props.activateTool("boundingBox");
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={tooltips.boundingBox}
        onClick={this.selectBoundingBox}
        fill={this.props.buttonClicked === tooltips.boundingBox.name}
      />
    </>
  );
}

export { Toolbar };
