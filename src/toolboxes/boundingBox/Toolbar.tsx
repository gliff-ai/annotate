import { Component, ReactElement } from "react";
import { BaseIconButton } from "@gliff-ai/style";
import { Tools } from "@/tooltips";
import { Toolbox, Toolboxes } from "@/Toolboxes";

const events = ["selectBoundingBox"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  activateToolbox: (activeToolbox: Toolbox) => void;
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
    if (event.detail === Tools.boundingBox.name) {
      this[event.type]?.call(this);
    }
  };

  selectBoundingBox = (): void => {
    if (this.props.isTyping()) return;
    this.props.setButtonClicked(Tools.boundingBox.name);
    this.props.activateToolbox(Toolboxes.boundingBox);
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={Tools.boundingBox}
        onClick={this.selectBoundingBox}
        fill={this.props.buttonClicked === Tools.boundingBox.name}
      />
    </>
  );
}

export { Toolbar };
