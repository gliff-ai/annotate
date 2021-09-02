import { Component, ChangeEvent, ReactElement, MouseEvent } from "react";
import {
  ButtonGroup,
  createStyles,
  makeStyles,
  Paper,
  Popover,
} from "@material-ui/core";
import { BaseIconButton } from "@gliff-ai/style";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { BaseSlider } from "@/components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";
import { usePaintbrushStore } from "./Store";
import { ToolboxName, Tools } from "./Toolbox";

interface SubMenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
}

const useStyles = makeStyles(() =>
  createStyles({
    baseSlider: {
      width: "63px",
      height: "285px",
      textAlign: "center",
    },
    subMenu: {
      display: "flex",
      justifyContent: "space-between",
      width: "136px",
      background: "none",
    },
  })
);

const Submenu = (props: SubMenuProps): ReactElement => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();
  const classes = useStyles();

  function changeBrushRadius(e: ChangeEvent, value: number) {
    setPaintbrush({
      brushType: paintbrush.brushType, // FIXME
      brushRadius: value,
    });
  }

  function fillBrush() {
    document.dispatchEvent(
      new CustomEvent("fillBrush", { detail: Toolboxes.paintbrush })
    );
  }

  function selectBrush() {
    setPaintbrush({
      brushType: Tools.paintbrush.name,
      brushRadius: paintbrush.brushRadius, // FIXME
    });
  }

  function selectEraser() {
    setPaintbrush({
      brushType: Tools.eraser.name,
      brushRadius: paintbrush.brushRadius, // FIXME
    });
  }

  return (
    <>
      <Popover
        open={props.isOpen}
        anchorEl={props.anchorElement}
        onClose={props.onClose}
        PaperProps={{ classes: { root: classes.subMenu } }}
      >
        <ButtonGroup
          orientation="vertical"
          size="small"
          id="paintbrush-toolbar"
        >
          <BaseIconButton
            tooltip={Tools.paintbrush}
            onClick={() => selectBrush}
            fill={paintbrush.brushType === Tools.paintbrush.name}
          />
          <BaseIconButton
            tooltip={Tools.eraser}
            onClick={() => selectEraser}
            fill={paintbrush.brushType === Tools.eraser.name}
          />
          <BaseIconButton
            tooltip={Tools.fillbrush}
            onClick={() => fillBrush}
            fill={false}
          />
        </ButtonGroup>
        <Paper>
          <div className={classes.baseSlider}>
            <BaseSlider
              value={paintbrush.brushRadius}
              config={SLIDER_CONFIG[Sliders.brushRadius]}
              onChange={() => changeBrushRadius}
              showEndValues={false}
            />
          </div>
        </Paper>
      </Popover>
    </>
  );
};

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  activateToolbox: (activeToolbox: Toolbox) => void;
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
    if (event.detail === Toolboxes.paintbrush) {
      this[event.type]?.call(this);
    }
  };

  selectBrush = (): void => {
    if (this.props.isTyping()) return;
    this.props.handleOpen()(this.refBrushPopover);
    this.props.setButtonClicked(Tools.paintbrush.name);
    this.props.activateToolbox(ToolboxName);
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={Tools.paintbrush}
        onClick={this.selectBrush}
        fill={this.props.buttonClicked === Tools.paintbrush.name}
        setRefCallback={(ref) => {
          this.refBrushPopover = ref;
        }}
      />
      <Submenu
        isOpen={
          this.props.buttonClicked === Tools.paintbrush.name &&
          Boolean(this.props.anchorElement)
        }
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
      />
    </>
  );
}

export { Toolbar };
