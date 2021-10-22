import { Component, ReactElement } from "react";
import { IconButton, icons } from "@gliff-ai/style";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { getShortcut } from "@/keybindings";
import { ButtonGroup } from "@material-ui/core";

const ToolboxName: Toolbox = "boundingBox";

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
    if (event.detail === "Rectangular Bounding Box") {
      this[event.type]?.call(this);
    }
  };

  selectBoundingBox = (): void => {
    if (this.props.isTyping()) return;
    this.props.setButtonClicked("Rectangular Bounding Box");
    this.props.activateToolbox(Toolboxes.boundingBox);
  };

  render = (): ReactElement => (
    <>
      <ButtonGroup style={{ all: "revert" }}>
        <IconButton
          tooltip={{
            name: "Rectangular Bounding Box",
            ...getShortcut(`${ToolboxName}.selectBoundingBox`),
          }}
          icon={icons.boundingBox}
          fill={this.props.buttonClicked === "Rectangular Bounding Box"}
          onClick={this.selectBoundingBox}
        />
      </ButtonGroup>
    </>
  );
}

export { Toolbar, ToolboxName };
