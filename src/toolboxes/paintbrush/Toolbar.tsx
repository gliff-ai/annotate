import {
  Component,
  ChangeEvent,
  ReactElement,
  MouseEvent,
  useState,
} from "react";
import {
  ButtonGroup,
  Card,
  createStyles,
  makeStyles,
  Popover,
} from "@material-ui/core";

import { BaseIconButton, theme } from "@gliff-ai/style";

import { Toolbox, Toolboxes } from "@/Toolboxes";
import { BaseSlider } from "@/components/BaseSlider";

import { ToolboxName, Tools } from "./Toolbox";
import { usePaintbrushStore } from "./Store";
import { Sliders, SLIDER_CONFIG } from "./configSlider";

interface SubmenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
}

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
      background: "none",
    },
    subMenuCard: {
      height: "285px",
      marginLeft: "18px", // TODO other toolbars should use this approach
    },
    baseSliderContainer: {
      display: "flex",
      flexDirection: "row",
    },
    buttonGroup: {
      [theme.breakpoints.down("md")]: {
        width: "45px",
        padding: "0px",
      },
    },
  })
);

const Submenu = (props: SubmenuProps): ReactElement => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();
  const [showTransparency, setShowTransparency] = useState<boolean>(false);
  const [pixelView, setPixelView] = useState<boolean>(false);

  const classes = useStyles();

  function changeBrushRadius(e: ChangeEvent, value: number) {
    setPaintbrush({
      brushType: paintbrush.brushType, // FIXME
      brushRadius: value / 2, // convert from diameter (the displayed size) to radius (what the rest of the codebase expects)
      annotationAlpha: paintbrush.annotationAlpha,
      annotationActiveAlpha: paintbrush.annotationActiveAlpha,
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
      annotationAlpha: paintbrush.annotationAlpha,
      annotationActiveAlpha: paintbrush.annotationActiveAlpha,
    });
  }

  function selectEraser() {
    setPaintbrush({
      brushType: Tools.eraser.name,
      brushRadius: paintbrush.brushRadius, // FIXME
      annotationAlpha: paintbrush.annotationAlpha,
      annotationActiveAlpha: paintbrush.annotationActiveAlpha,
    });
  }

  function toggleShowTransparency() {
    if (showTransparency) {
      setShowTransparency(false);
    } else {
      setShowTransparency(true);
    }
  }

  function togglePixelView() {
    setPixelView(!pixelView);
    document.dispatchEvent(
      new CustomEvent("togglePixelView", { detail: Toolboxes.paintbrush })
    );
  }

  function changeAnnotationTransparency(e: ChangeEvent, value: number) {
    setPaintbrush({
      brushType: paintbrush.brushType,
      brushRadius: paintbrush.brushRadius, // FIXME
      annotationAlpha: value,
      annotationActiveAlpha: paintbrush.annotationActiveAlpha,
    });
  }

  function changeAnnotationTransparencyFocused(e: ChangeEvent, value: number) {
    setPaintbrush({
      brushType: paintbrush.brushType,
      brushRadius: paintbrush.brushRadius, // FIXME
      annotationAlpha: paintbrush.annotationAlpha,
      annotationActiveAlpha: value,
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
          className={classes.buttonGroup}
        >
          <BaseIconButton
            tooltip={Tools.paintbrush}
            onClick={() => selectBrush()}
            fill={paintbrush.brushType === Tools.paintbrush.name}
          />
          <BaseIconButton
            tooltip={Tools.eraser}
            onClick={() => selectEraser()}
            fill={paintbrush.brushType === Tools.eraser.name}
          />
          <BaseIconButton
            tooltip={Tools.fillbrush}
            onClick={() => fillBrush()}
            fill={false}
          />
          <BaseIconButton
            tooltip={Tools.annotationAlpha}
            onClick={() => toggleShowTransparency()}
            fill={showTransparency}
          />
          <BaseIconButton
            tooltip={Tools.togglePixels}
            onClick={() => {
              togglePixelView();
            }}
            fill={pixelView}
          />
        </ButtonGroup>
        <Card className={classes.subMenuCard}>
          <div className={classes.baseSliderContainer}>
            <div className={classes.baseSlider}>
              <BaseSlider
                value={paintbrush.brushRadius * 2}
                config={SLIDER_CONFIG[Sliders.brushRadius]}
                onChange={() => changeBrushRadius}
                showEndValues={false}
              />
            </div>
            {showTransparency && (
              <>
                <div className={classes.baseSlider}>
                  <BaseSlider
                    value={paintbrush.annotationAlpha}
                    config={SLIDER_CONFIG[Sliders.annotationAlpha]}
                    onChange={() => changeAnnotationTransparency}
                    showEndValues={false}
                  />
                </div>
                <div className={classes.baseSlider}>
                  <BaseSlider
                    value={paintbrush.annotationActiveAlpha}
                    config={SLIDER_CONFIG[Sliders.annotationActiveAlpha]}
                    onChange={() => changeAnnotationTransparencyFocused}
                    showEndValues={false}
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      </Popover>
    </>
  );
};

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
