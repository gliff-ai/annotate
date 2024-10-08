import { Component, ReactElement, MouseEvent, useState } from "react";

import {
  Popper,
  IconButton,
  icons,
  ButtonGroup,
  MuiCard,
  Divider,
} from "@gliff-ai/style";
import { Box } from "@mui/system";

import { Toolbox, Toolboxes } from "@/Toolboxes";
import { BaseSlider } from "@/components/BaseSlider";

import { usePaintbrushStore } from "./Store";
import { Sliders, SLIDER_CONFIG } from "./configSlider";
import { getShortcut } from "@/keybindings";
import { useMountEffect } from "@/hooks/use-mountEffect";

interface SubmenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  openSubmenu: () => void;
  is3D: boolean;
}

interface Props {
  active: boolean; // toolbox is active
  activateToolbox: (activeToolbox: Toolbox) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
  anchorElement: HTMLButtonElement | null;
  is3D: boolean;
}

const baseSliderStyle = {
  width: "285",
  height: "65px",
  textAlign: "center",
  display: "flex",
  mb: "6px",
};

const sliderNameStyle = {
  marginLeft: "12px",
  marginBottom: "-2px",
  paddingTop: "6px",
  fontWeight: 500,
};

const events = ["selectBrush"] as const;
const ToolboxName: Toolbox = "paintbrush";

interface Event extends CustomEvent {
  type: typeof events[number];
}

const Submenu = (props: SubmenuProps): ReactElement => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();
  const [showTransparency, setShowTransparency] = useState<boolean>(false);
  const [openSubmenu, setOpenSubMenu] = useState<boolean>(false);
  const [openSlider, setOpenSlider] = useState<boolean>(true);

  const submenuEvents = [
    "selectBrush",
    "selectEraser",
    "toggleShowTransparency",
    "toggleSuperMarker",
  ] as const;

  function changeBrushRadius(_e: Event, value: number) {
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
    if (!openSlider) {
      setOpenSlider(true);
    }
    setPaintbrush({
      ...paintbrush,
      brushType: "Paintbrush",
    });
    setOpenSubMenu(true);
    setShowTransparency(false);

    return true;
  }

  function selectEraser() {
    if (!openSlider) {
      setOpenSlider(true);
    }
    setPaintbrush({
      ...paintbrush,
      brushType: "Eraser",
    });
    setOpenSubMenu(true);
    setShowTransparency(false);

    return true;
  }

  function toggleShowTransparency() {
    setOpenSubMenu(true);
    if (showTransparency) {
      setShowTransparency(false);

      setOpenSubMenu(false);
    } else {
      setShowTransparency(true);
    }
    setOpenSlider(!openSlider);
    setPaintbrush({
      ...paintbrush,
      brushType: "",
    });
    return true;
  }

  function toggleSuperMarker() {
    // like the brush and eraser we open the radius slider as regions depend on it for size
    if (!openSlider) {
      setOpenSlider(true);
    }
    setPaintbrush({
      ...paintbrush,
      isSuper: !paintbrush.isSuper,
    });
    document.dispatchEvent(
      new CustomEvent("toggleSuperMarker", { detail: Toolboxes.paintbrush })
    );
    setOpenSubMenu(true);
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

  function toggle3D() {
    setPaintbrush({
      ...paintbrush,
      is3D: !paintbrush.is3D,
    });
    document.dispatchEvent(
      new CustomEvent("toggle3D", { detail: Toolboxes.paintbrush })
    );

    return true;
  }

  function changeAnnotationTransparency(_e: Event, annotationAlpha: number) {
    setPaintbrush({
      ...paintbrush,
      annotationAlpha,
    });
  }

  function changeAnnotationTransparencyFocused(
    _e: Event,
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
      selectBrush,
      selectEraser,
      toggleShowTransparency,
      toggle3D,
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
      disabled: () => false,
    },
    {
      name: "Eraser",
      icon: icons.eraser,
      event: selectEraser,
      active: () => paintbrush.brushType === "Eraser",
      disabled: () => false,
    },
    {
      name: "Use 3D brushstrokes",
      icon: icons.brush3D,
      event: toggle3D,
      active: () => paintbrush.is3D,
      disabled: () => !props.is3D,
    },
    {
      name: "Fill Active Paintbrush",
      icon: icons.fill,
      event: fillBrush,
      active: () => false,
      disabled: () => false,
    },
    {
      name: "Super Marker (Beta)",
      icon: icons.superMarker,
      event: toggleSuperMarker,
      active: () => paintbrush.isSuper,
      disabled: () => false,
    },
    {
      name: "Annotation Transparency",
      icon: icons.annotationTransparency,
      event: toggleShowTransparency,
      active: () => showTransparency,
      disabled: () => false,
    },
    {
      name: "Show strokes as pixels",
      icon: icons.convert,
      event: togglePixelView,
      active: () => paintbrush.pixelView,
      disabled: () => false,
    },
  ];

  const handleClickAway = () => {
    setOpenSubMenu(false);
  };

  if (props.anchorElement === null) return null;

  return (
    <>
      <Popper
        open={props.isOpen}
        anchorEl={props.anchorElement}
        offset={[40, 10]}
        handleClickAway={handleClickAway}
        el={
          <>
            <ButtonGroup
              orientation="vertical"
              size="small"
              id="paintbrush-toolbar"
              style={{ marginRight: "-10px" }}
              variant="text"
            >
              {tools.map(({ icon, name, event, active, disabled }) => (
                <IconButton
                  key={name}
                  icon={icon}
                  tooltip={{
                    name,
                    ...getShortcut(`${ToolboxName}.${event.name}`),
                  }}
                  onClick={event}
                  fill={active()}
                  disabled={disabled()}
                  id={`id-${name.toLowerCase().replace(/ /g, "-")}`}
                  size="small"
                />
              ))}
            </ButtonGroup>

            <>
              {openSubmenu && (
                <MuiCard
                  sx={{
                    width: "285px",
                    height: "fit-content",
                    marginLeft: "18px",
                  }}
                >
                  {openSlider && (
                    <>
                      <Box sx={{ ...sliderNameStyle }}>
                        {paintbrush.brushType === "Paintbrush"
                          ? "Brush Size"
                          : "Eraser Size"}
                      </Box>
                      <Box sx={{ ...baseSliderStyle }}>
                        <BaseSlider
                          value={paintbrush.brushRadius * 2}
                          config={SLIDER_CONFIG[Sliders.brushRadius]}
                          onChange={() => changeBrushRadius}
                        />
                      </Box>
                    </>
                  )}
                  {showTransparency && (
                    <>
                      <Box sx={{ ...sliderNameStyle }}>
                        Non-Active Annotation
                      </Box>
                      <Box sx={{ ...baseSliderStyle }}>
                        <BaseSlider
                          value={paintbrush.annotationAlpha}
                          config={SLIDER_CONFIG[Sliders.annotationAlpha]}
                          onChange={() => changeAnnotationTransparency}
                        />
                      </Box>
                      <Divider
                        sx={{
                          margin: 0,
                          width: "100%",
                        }}
                      />
                      <Box sx={{ ...sliderNameStyle }}>Active Annotation</Box>
                      <Box sx={{ ...baseSliderStyle }}>
                        <BaseSlider
                          value={paintbrush.annotationActiveAlpha}
                          config={SLIDER_CONFIG[Sliders.annotationActiveAlpha]}
                          onChange={() => changeAnnotationTransparencyFocused}
                        />
                      </Box>
                    </>
                  )}
                </MuiCard>
              )}
            </>
          </>
        }
      />
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
    this.props.handleOpen()(this.refBrushPopover);
    this.props.activateToolbox(ToolboxName);
  };

  render = (): ReactElement => (
    <>
      <ButtonGroup style={{ all: "revert" }} variant="text">
        <IconButton
          tooltip={{
            name: "Paintbrush",
            ...getShortcut("paintbrush.selectBrush"),
          }}
          icon={icons.brush}
          onClick={this.openSubmenu}
          fill={this.props.active}
          setRefCallback={(ref: HTMLButtonElement) => {
            this.refBrushPopover = ref;
          }}
          id="id-paintbrush-toolbox"
          size="small"
        />
      </ButtonGroup>

      <Submenu
        isOpen={Boolean(this.props.anchorElement === this.refBrushPopover)}
        openSubmenu={this.openSubmenu}
        anchorElement={this.props.anchorElement}
        is3D={this.props.is3D}
      />
    </>
  );
}

export { Toolbar, ToolboxName };
