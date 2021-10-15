import {
  Component,
  ChangeEvent,
  ReactElement,
  useState,
  MouseEvent,
} from "react";
import {
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormControl,
  Popover,
  Card,
  makeStyles,
  createStyles,
  Theme,
  CardHeader,
  CardContent,
  Typography,
} from "@material-ui/core";
import SVG from "react-inlinesvg";

import { IconButton, icons } from "@gliff-ai/style";
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
  onClose: (event: MouseEvent) => void;
  channelControls: ReactElement[];
  openSubmenu: () => void;
}

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
  onClose: (event: MouseEvent) => void;
  anchorElement: HTMLButtonElement | null;
  isTyping: () => boolean;
  channels: boolean[];
  toggleChannelAtIndex: (index: number) => void;
  displayedImage: ImageBitmap;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    subMenu: {
      display: "flex",
      justifyContent: "space-between",
      //   width: "136px",
      height: "285px",
      background: "none",
    },
    subMenuCard: {
      height: "fit-content",
      marginLeft: "18px", // TODO other toolbars should use this approach
    },
    baseSlider: {
      width: "63px",
      height: "auto",
      textAlign: "center",
    },
    channelHeader: {
      backgroundColor: theme.palette.primary.main,
    },

    channelInfo: {
      fontSize: "14px",
      fontWeight: 400,
    },
  })
);

const Submenu = (props: SubmenuProps): ReactElement => {
  const [background, setBackground] = useBackgroundStore();
  const [buttonClicked, setButtonClicked] = useState(null as string);
  const classes = useStyles();

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

  function changeBrightness(e: ChangeEvent, value: number) {
    setBackground({
      brightness: value,
      contrast: background.contrast,
    });
  }

  function selectContrast() {
    setButtonClicked("Contrast");
    return true;
  }

  function changeContrast(e: ChangeEvent, value: number) {
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

  return (
    <>
      <Popover
        open={props.isOpen}
        anchorEl={props.anchorElement}
        onClose={props.onClose}
        PaperProps={{ classes: { root: classes.subMenu } }}
        elevation={0}
      >
        <ButtonGroup
          orientation="vertical"
          size="small"
          id="background-settings-toolbar"
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
          {buttonClicked === "Brightness" && (
            <div className={classes.baseSlider}>
              <BaseSlider
                value={background.brightness}
                config={SLIDER_CONFIG[Sliders.brightness]}
                onChange={() => changeBrightness}
                showEndValues={false}
              />
            </div>
          )}
          {buttonClicked === "Contrast" && (
            <div className={classes.baseSlider}>
              <BaseSlider
                value={background.contrast}
                config={SLIDER_CONFIG[Sliders.contrast]}
                onChange={() => changeContrast}
                showEndValues={false}
              />
            </div>
          )}
          {buttonClicked === "Channels" && props.channelControls && (
            <>
              <CardHeader
                className={classes.channelHeader}
                title={
                  <Typography style={{ fontWeight: 500 }}>Channel</Typography>
                }
              />
              <CardContent>
                <FormControl component="fieldset">
                  <FormGroup aria-label="position">
                    {props.channelControls.map((control, i) => (
                      <FormControlLabel
                        key={`C${i + 1}`}
                        value="top"
                        control={control}
                        label={
                          <Typography className={classes.channelInfo}>
                            {`Channel ${i + 1}`}
                          </Typography>
                        }
                        labelPlacement="end"
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </CardContent>
            </>
          )}
        </Card>
      </Popover>
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
    if (this.props.isTyping()) return;
    this.props.handleOpen()(this.refBackgroundSettingsPopover);
    this.props.setButtonClicked("Background Settings");
  };

  render = (): ReactElement => (
    <>
      <IconButton
        tooltip={{
          name: "Background Settings",
        }}
        icon={icons.backgroundSettings}
        onClick={this.openSubmenu}
        fill={this.props.buttonClicked === "Background Settings"}
        setRefCallback={(ref) => {
          this.refBackgroundSettingsPopover = ref;
        }}
      />

      <Submenu
        isOpen={
          this.props.buttonClicked === "Background Settings" &&
          Boolean(this.props.anchorElement)
        }
        openSubmenu={this.openSubmenu}
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
        channelControls={this.channelControls}
      />
    </>
  );
}

export { Toolbar, ToolboxName };
