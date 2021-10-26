import {
  Component,
  ChangeEvent,
  ReactElement,
  MouseEvent,
  useState,
  useEffect,
} from "react";
import {
  ButtonGroup,
  Card,
  createStyles,
  Divider,
  makeStyles,
  Popper,
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
  keepSubmenuOpen: boolean;
}

interface Props {
  buttonClicked: string;
  keepSubmenuOpen: boolean;
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
      width: "285",
      height: "65px",
      textAlign: "center",
      display: "flex",
    },
    subMenu: {
      display: "flex",
      justifyContent: "space-between",
      background: "none",
    },
    subMenuCard: {
      width: "285px",
      height: "fit-content",
      marginLeft: "18px", // TODO other toolbars should use this approach
    },
    sliderName: {
      marginLeft: "12px",
      marginBottom: "-2px",
      paddingTop: "6px",
      fontWeight: 500,
    },
    divider: {
      margin: 0,
      width: "100%",
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
  const [openSubmenu, setOpenSubMenu] = useState<boolean>(
    props.keepSubmenuOpen
  );

  useEffect(() => {
    setOpenSubMenu(props.keepSubmenuOpen);
  }, [props.keepSubmenuOpen]);

  const submenuEvents = [
    "selectBrush",
    "selectEraser",
    "toggleShowTransparency",
    "fillBrush",
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
    setOpenSubMenu(true);
    setShowTransparency(false);

    return true;
  }

  function selectEraser() {
    setPaintbrush({
      ...paintbrush,
      brushType: "Eraser",
    });
    setOpenSubMenu(true);
    setShowTransparency(false);

    return true;
  }

  function toggleShowTransparency() {
    if (showTransparency) {
      setShowTransparency(false);
      setOpenSubMenu(!openSubmenu);
    } else {
      setShowTransparency(true);
    }
    setPaintbrush({
      ...paintbrush,
      brushType: "",
    });
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
      <Popper
        open={props.isOpen}
        anchorEl={props.anchorElement}
        placement="right"
        style={{ display: "flex" }}
        modifiers={{
          offset: {
            enabled: true,
            offset: "40, 10",
          },
        }}
      >
        <ButtonGroup
          orientation="vertical"
          size="small"
          id="paintbrush-toolbar"
          style={{ marginRight: "-10px" }}
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
        {openSubmenu && (
          <Card className={classes.subMenuCard}>
            {!showTransparency && (
              <>
                <div className={classes.sliderName}>
                  {paintbrush.brushType === "Paintbrush"
                    ? "Brush Size"
                    : "Eraser Size"}
                </div>
                <div className={classes.baseSlider}>
                  <BaseSlider
                    value={paintbrush.brushRadius * 2}
                    config={SLIDER_CONFIG[Sliders.brushRadius]}
                    onChange={() => changeBrushRadius}
                  />
                </div>
              </>
            )}

            {showTransparency && (
              <>
                <div className={classes.sliderName}>Non-Active Annotation</div>
                <div className={classes.baseSlider}>
                  <BaseSlider
                    value={paintbrush.annotationAlpha}
                    config={SLIDER_CONFIG[Sliders.annotationAlpha]}
                    onChange={() => changeAnnotationTransparency}
                  />
                </div>
                <Divider className={classes.divider} />
                <div className={classes.sliderName}>Active Annotation</div>
                <div className={classes.baseSlider}>
                  <BaseSlider
                    value={paintbrush.annotationActiveAlpha}
                    config={SLIDER_CONFIG[Sliders.annotationActiveAlpha]}
                    onChange={() => changeAnnotationTransparencyFocused}
                  />
                </div>
              </>
            )}
          </Card>
        )}
      </Popper>
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
      <ButtonGroup style={{ all: "revert" }}>
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
      </ButtonGroup>

      <Submenu
        isOpen={
          this.props.buttonClicked === "Paintbrush" &&
          Boolean(this.props.anchorElement)
        }
        openSubmenu={this.openSubmenu}
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
        keepSubmenuOpen={this.props.keepSubmenuOpen}
      />
    </>
  );
}

export { Toolbar, ToolboxName };
