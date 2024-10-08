import { Component, ReactElement } from "react";
import { IconButton, icons } from "@gliff-ai/style";
import { ButtonGroup } from "@mui/material";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { getShortcut } from "@/keybindings";

const ToolboxName: Toolbox = "boundingBox";

const events = ["selectBoundingBox"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

interface Props {
  active: boolean; // toolbox is active
  activateToolbox: (activeToolbox: Toolbox) => void;
  handleOpen: (
    event?: React.MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
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
    if (event.detail === Toolboxes.boundingBox) {
      this[event.type]?.call(this);
    }
  };

  selectBoundingBox = (): void => {
    this.props.activateToolbox(Toolboxes.boundingBox);
    this.props.handleOpen()(null); // close whatever submenu is open (boundingBox doesn't have a submenu)
  };

  render = (): ReactElement => (
    <>
      <ButtonGroup style={{ all: "revert" }} variant="text">
        <IconButton
          tooltip={{
            name: "Rectangular Bounding Box",
            ...getShortcut(`${ToolboxName}.selectBoundingBox`),
          }}
          icon={icons.boundingBox}
          fill={this.props.active}
          onClick={this.selectBoundingBox}
          id="id-bounding-box"
          size="small"
        />
      </ButtonGroup>
    </>
  );
}

export { Toolbar, ToolboxName };
