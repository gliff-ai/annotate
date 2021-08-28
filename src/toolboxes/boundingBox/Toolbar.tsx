import { Component, ReactElement } from "react";
import { BaseIconButton } from "@gliff-ai/style";
import { tools } from "@/tooltips";
import { Toolbox, Toolboxes } from "@/Toolboxes";

const events = ["selectBoundingBox"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  activateToolbox: (activeTool: Toolbox) => void;
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
    if (event.detail === tools.boundingBox.name) {
      this[event.type]?.call(this);
    }
  };

  selectBoundingBox = (): void => {
    if (this.props.isTyping()) return;
    this.props.setButtonClicked(tools.boundingBox.name);
    this.props.activateToolbox(Toolboxes.boundingBox);
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={tools.boundingBox}
        onClick={this.selectBoundingBox}
        fill={this.props.buttonClicked === tools.boundingBox.name}
      />
    </>
  );
}

export { Toolbar };
