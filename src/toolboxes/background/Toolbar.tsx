import { Component, ReactElement, useState, MouseEvent } from "react";
import { FormGroup } from "@mui/material"; // TODO move to STYLE

import SVG from "react-inlinesvg";
import { detect } from "detect-browser";

import {
  IconButton,
  icons,
  Popper,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  FormControl,
  Card,
  Typography,
  Box,
  MuiCard,
} from "@gliff-ai/style";
import { BaseSlider } from "@/components/BaseSlider";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { getShortcut } from "@/keybindings";
import { useBackgroundStore } from "./Store";
import { Sliders, SLIDER_CONFIG } from "./configSlider";
import { useMountEffect } from "@/hooks/use-mountEffect";

const ToolboxName: Toolbox = "background";

interface SubmenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  channelControls: ReactElement[];
  openSubmenu: () => void;
  isChannelPinned: boolean;
  handleChannelPin: () => void;
}

interface Props {
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
  anchorElement: HTMLButtonElement | null;
  channels: boolean[];
  toggleChannelAtIndex: (index: number) => void;
  isChannelPinned: boolean;
  handleChannelPin: () => void;
}

const baseSliderStyle = {
  width: "285px",
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

const Submenu = (props: SubmenuProps): ReactElement => {
  const [background, setBackground] = useBackgroundStore();
  const [buttonClicked, setButtonClicked] = useState(null as string);

  const submenuEvents = [
    "selectContrast",
    "selectBrightness",
    "selectChannels",
  ] as const;

  interface Event extends CustomEvent {
    type: typeof submenuEvents[number];
  }

  function selectBrightness() {
    setButtonClicked("Brightness");
    return true;
  }

  function changeBrightness(e: Event, value: number) {
    setBackground({
      brightness: value,
      contrast: background.contrast,
    });
  }

  function selectContrast() {
    setButtonClicked("Contrast");
    return true;
  }

  function changeContrast(e: Event, value: number) {
    setBackground({
      contrast: value,
      brightness: background.brightness,
    });
  }

  function selectChannels() {
    setButtonClicked("Channels");
    return true;
  }

  const tools = [
    {
      name: "Contrast",
      icon: icons.contrast,
      active: () => buttonClicked === "Contrast",
      event: selectContrast,
    },
    {
      name: "Brightness",
      icon: icons.brightness,
      active: () => buttonClicked === "Brightness",
      event: selectBrightness,
    },
    {
      name: "Channels",
      icon: icons.channels,
      active: () => buttonClicked === "Channels",
      event: selectChannels,
    },
  ];

  useMountEffect(() => {
    const submenuEventFunctions = {
      selectContrast,
      selectBrightness,
      selectChannels,
    };

    const handleEvent = (event: Event): void => {
      if (event.detail === Toolboxes.background) {
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

  const handleClickAway = () => {
    if (buttonClicked === "Channels" && props.isChannelPinned) return;
    setButtonClicked("");
  };

  const browser = detect().name;

  if (props.anchorElement === null) return null;

  return (
    <>
      <Popper
        open={props.isOpen}
        anchorEl={props.anchorElement}
        popperPlacement="right-end"
        style={{ display: "flex" }}
        handleClickAway={handleClickAway}
        el={
          <>
            <ButtonGroup
              orientation="vertical"
              size="small"
              id="background-settings-toolbar"
              style={{ marginRight: "-10px" }}
              variant="text"
            >
              {tools
                .filter(
                  ({ name }) =>
                    browser !== "safari" ||
                    !(name === "Contrast" || name === "Brightness")
                )
                .map(({ icon, name, event, active }) => (
                  <IconButton
                    key={name}
                    icon={icon}
                    tooltip={{
                      name,
                      ...getShortcut(`${ToolboxName}.${event.name}`),
                    }}
                    onClick={event}
                    fill={active()}
                    size="small"
                  />
                ))}
            </ButtonGroup>
            <MuiCard
              sx={{
                height: "fit-content",
                width: "285px",
                marginLeft: "18px",
                borderRadius: "6px",
              }}
            >
              <>
                {buttonClicked === "Brightness" && (
                  <>
                    <Box sx={{ ...sliderNameStyle }}>Brightness</Box>
                    <Box sx={{ ...baseSliderStyle }}>
                      <BaseSlider
                        value={background.brightness}
                        config={SLIDER_CONFIG[Sliders.brightness]}
                        onChange={() => changeBrightness}
                      />
                    </Box>
                  </>
                )}

                {buttonClicked === "Contrast" && (
                  <>
                    <Box sx={{ ...sliderNameStyle }}>Contrast</Box>
                    <Box sx={{ ...baseSliderStyle }}>
                      <BaseSlider
                        value={background.contrast}
                        config={SLIDER_CONFIG[Sliders.contrast]}
                        onChange={() => changeContrast}
                      />
                    </Box>
                  </>
                )}
                {buttonClicked === "Channels" && props.channelControls && (
                  <>
                    <Card
                      title="Channel"
                      isPinned={props.isChannelPinned}
                      handlePin={props.handleChannelPin}
                    >
                      <FormControl component="fieldset">
                        <FormGroup aria-label="position">
                          {props.channelControls.map((control, i) => (
                            <FormControlLabel
                              key={`C${i + 1}`}
                              value="top"
                              control={control}
                              label={
                                <Typography
                                  sx={{ fontSize: "14px", fontWeight: 400 }}
                                >
                                  {`Channel ${i + 1}`}
                                </Typography>
                              }
                              labelPlacement="end"
                            />
                          ))}
                        </FormGroup>
                      </FormControl>
                    </Card>
                  </>
                )}
              </>
            </MuiCard>
          </>
        }
      />
    </>
  );
};

class Toolbar extends Component<Props> {
  private refBackgroundSettingsPopover: HTMLButtonElement;

  private channelControls: JSX.Element[];

  constructor(props: Props) {
    super(props);
    this.channelControls = null;
    this.refBackgroundSettingsPopover = null;
  }

  componentDidUpdate = (): void => {
    this.updateChannelChoices();
  };

  updateChannelChoices = (): void => {
    // Update channel controls when a new image is uploaded.
    const untickedIcon = (
      <SVG src={icons.notSelectedTickbox} width="18px" height="auto" />
    );
    const tickedIcon = (
      <SVG src={icons.selectedTickbox} width="18px" height="auto" />
    );
    this.channelControls = this.props.channels.map((channel, i) => (
      <Checkbox
        // className={classes.checkbox}
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        checked={channel}
        icon={untickedIcon}
        checkedIcon={tickedIcon}
        onChange={() => {
          this.props.toggleChannelAtIndex(i);
        }}
      />
    ));
  };

  openSubmenu = (): void => {
    this.props.handleOpen()(this.refBackgroundSettingsPopover);
  };

  render = (): ReactElement => (
    <>
      <ButtonGroup style={{ all: "revert" }} variant="text">
        <IconButton
          tooltip={{
            name: "Background Settings",
          }}
          icon={icons.backgroundSettings}
          onClick={this.openSubmenu}
          fill={Boolean(
            this.props.anchorElement === this.refBackgroundSettingsPopover
          )}
          setRefCallback={(ref) => {
            this.refBackgroundSettingsPopover = ref;
          }}
          size="small"
        />
      </ButtonGroup>

      <Submenu
        isOpen={Boolean(
          this.props.anchorElement === this.refBackgroundSettingsPopover
        )}
        openSubmenu={this.openSubmenu}
        anchorElement={this.props.anchorElement}
        channelControls={this.channelControls}
        isChannelPinned={this.props.isChannelPinned}
        handleChannelPin={this.props.handleChannelPin}
      />
    </>
  );
}

export { Toolbar, ToolboxName };
