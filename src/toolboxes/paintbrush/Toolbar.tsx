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

import { IconButton, icons } from "@gliff-ai/style";

import { Toolbox, Toolboxes } from "@/Toolboxes";
import { BaseSlider } from "@/components/BaseSlider";

import { usePaintbrushStore } from "./Store";
import { Sliders, SLIDER_CONFIG } from "./configSlider";
import { getShortcut } from "@/keybindings";
import { useMountEffect } from "@/hooks/use-mountEffect";

interface SubmenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
  openSubmenu: () => void;
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
  })
);

const events = ["selectBrush"] as const;
const ToolboxName: Toolbox = "paintbrush";

interface Event extends CustomEvent {
  type: typeof events[number];
}

const Submenu = (props: SubmenuProps): ReactElement => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();
  const [showTransparency, setShowTransparency] = useState<boolean>(false);

  const submenuEvents = [
    "selectBrush",
    "selectEraser",
    "fillBrush",
    "toggleShowTransparency",
  ] as const;

  const classes = useStyles();

  function changeBrushRadius(_e: ChangeEvent, value: number) {
    setPaintbrush({
      ...paintbrush,
      brushRadius: value / 2, // convert from diameter (the displayed size) to radius (what the rest of the codebase expects)
    });
  }

  function fillBrush() {
    document.dispatchEvent(
      new CustomEvent("fillBrush", { detail: Toolboxes.paintbrush })
    );
  }

  function selectBrush() {
    setPaintbrush({
      ...paintbrush,
      brushType: "Paintbrush",
    });

    return true;
  }

  function selectEraser() {
    setPaintbrush({
      ...paintbrush,
      brushType: "Eraser",
    });

    return true;
  }

  function toggleShowTransparency() {
    if (showTransparency) {
      setShowTransparency(false);
    } else {
      setShowTransparency(true);
    }

    return true;
  }

  function togglePixelView() {
    setPaintbrush({
      ...paintbrush,
      pixelView: !paintbrush.pixelView,
    });
    document.dispatchEvent(
      new CustomEvent("togglePixelView", { detail: Toolboxes.paintbrush })
    );

    return true;
  }

  function changeAnnotationTransparency(
    _e: ChangeEvent,
    annotationAlpha: number
  ) {
    setPaintbrush({
      ...paintbrush,
      annotationAlpha,
    });
  }

  function changeAnnotationTransparencyFocused(
    _e: ChangeEvent,
    annotationActiveAlpha: number
  ) {
    setPaintbrush({
      ...paintbrush,
      annotationActiveAlpha,
    });
  }

  useMountEffect(() => {
    const submenuEventFunctions = {
      changeBrushRadius,
      fillBrush,
      selectBrush,
      selectEraser,
      toggleShowTransparency,
      changeAnnotationTransparency,
      changeAnnotationTransparencyFocused,
    };

    const handleEvent = (event: Event): void => {
      if (event.detail === Toolboxes.paintbrush) {
        // If the function we call returns true, also open the popup
        const popup = submenuEventFunctions[event.type]?.call(this) as boolean;
        if (popup) {
          props.openSubmenu();
        }
      }
    };

    for (const event of submenuEvents) {
      document.addEventListener(event, handleEvent);
    }

    // Specify how to clean up after this effect:
    return function cleanup() {
      for (const event of submenuEvents) {
        document.removeEventListener(event, handleEvent);
      }
    };
  });

  const tools = [
    {
      name: "Paintbrush",
      icon: icons.brush,
      event: selectBrush,
      active: () => paintbrush.brushType === "Paintbrush",
    },
    {
      name: "Eraser",
      icon: icons.eraser,
      event: selectEraser,
      active: () => paintbrush.brushType === "Eraser",
    },
    {
      name: "Fill Active Paintbrush",
      icon: icons.fill,
      event: fillBrush,
      active: () => false,
    },
    {
      name: "Annotation Transparency",
      icon: icons.annotationTransparency,
      event: toggleShowTransparency,
      active: () => showTransparency,
    },
    {
      name: "Show strokes as pixels",
      icon: icons.convert,
      event: togglePixelView,
      active: () => paintbrush.pixelView,
    },
  ];

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
          {tools.map(({ icon, name, event, active }) => (
            <IconButton
              key={name}
              icon={icon}
              tooltip={{
                name,
                ...getShortcut(`${ToolboxName}.${event.name}`),
              }}
              onClick={event}
              fill={active()}
            />
          ))}
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

class Toolbar extends Component<Props> {
  private refBrushPopover: HTMLButtonElement;

  constructor(props: Props) {
    super(props);
    this.refBrushPopover = null;
  }

  openSubmenu = (): void => {
    if (this.props.isTyping()) return;
    this.props.handleOpen()(this.refBrushPopover);
    this.props.setButtonClicked("Paintbrush");
    this.props.activateToolbox(ToolboxName);
  };

  render = (): ReactElement => (
    <>
      <IconButton
        tooltip={{
          name: "Paintbush",
          ...getShortcut("paintbrush.selectBrush"),
        }}
        icon={icons.brush}
        onClick={this.openSubmenu}
        fill={this.props.buttonClicked === "Paintbrush"}
        setRefCallback={(ref: HTMLButtonElement) => {
          this.refBrushPopover = ref;
        }}
      />

      <Submenu
        isOpen={
          this.props.buttonClicked === "Paintbrush" &&
          Boolean(this.props.anchorElement)
        }
        openSubmenu={this.openSubmenu}
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
      />
    </>
  );
}

export { Toolbar, ToolboxName };
