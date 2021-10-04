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
} from "@material-ui/core";
import SVG from "react-inlinesvg";

import { BaseIconButton } from "@gliff-ai/style";
import { BaseSlider } from "@/components/BaseSlider";
import { Toolboxes } from "@/Toolboxes";
import { imgSrc } from "@/imgSrc";

import { Tools } from "./Toolbox";
import { useBackgroundStore } from "./Store";
import { Sliders, SLIDER_CONFIG } from "./configSlider";

interface SubmenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
  channelControls: ReactElement[];
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
      height: "285px",
      marginLeft: "18px", // TODO other toolbars should use this approach
    },
    baseSlider: {
      width: "63px",
      height: "250px",
      textAlign: "center",
    },
    channelHeader: {
      backgroundColor: theme.palette.primary.main,
    },
    channelTypography: {
      display: "inline",
      fontSize: "21px",
      marginRight: "18px",
    },
  })
);

const Submenu = (props: SubmenuProps): ReactElement => {
  const [background, setBackground] = useBackgroundStore();
  const [buttonClicked, setButtonClicked] = useState(null as string);
  const classes = useStyles();

  function selectBrightness() {
    setButtonClicked(Tools.brightness.name);
  }

  function changeBrightness(e: ChangeEvent, value: number) {
    setBackground({
      brightness: value,
      contrast: background.contrast,
    });
  }

  function selectContrast() {
    setButtonClicked(Tools.contrast.name);
  }

  function changeContrast(e: ChangeEvent, value: number) {
    setBackground({
      contrast: value,
      brightness: background.brightness,
    });
  }

  function selectChannels() {
    setButtonClicked(Tools.channels.name);
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
          id="background-settings-toolbar"
        >
          <BaseIconButton
            tooltip={Tools.brightness}
            onClick={() => selectBrightness()}
            fill={buttonClicked === Tools.brightness.name}
          />
          <BaseIconButton
            tooltip={Tools.contrast}
            onClick={() => selectContrast()}
            fill={buttonClicked === Tools.contrast.name}
          />
          <BaseIconButton
            tooltip={Tools.channels}
            onClick={() => selectChannels()}
            fill={buttonClicked === Tools.channels.name}
          />
        </ButtonGroup>
        <Card className={classes.subMenuCard}>
          {buttonClicked === Tools.brightness.name && (
            <div className={classes.baseSlider}>
              <BaseSlider
                value={background.brightness}
                config={SLIDER_CONFIG[Sliders.brightness]}
                onChange={() => changeBrightness}
                showEndValues={false}
              />
            </div>
          )}
          {buttonClicked === Tools.contrast.name && (
            <div className={classes.baseSlider}>
              <BaseSlider
                value={background.contrast}
                config={SLIDER_CONFIG[Sliders.contrast]}
                onChange={() => changeContrast}
                showEndValues={false}
              />
            </div>
          )}
          {buttonClicked === Tools.channels.name && props.channelControls && (
            <>
              <CardHeader
                className={classes.channelHeader}
                title="Channels"
                titleTypographyProps={{ className: classes.channelTypography }}
                action={
                  <SVG src={imgSrc("pin-icon")} width="18px" height="auto" />
                }
              />
              <CardContent>
                <FormControl component="fieldset">
                  <FormGroup aria-label="position" row>
                    {props.channelControls.map((control, i) => (
                      <FormControlLabel
                        key={`C${i + 1}`}
                        value="top"
                        control={control}
                        label={`C${i + 1}`}
                        labelPlacement="start"
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

const events = ["selectBackgroundSettings"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}
class Toolbar extends Component<Props> {
  private refBackgroundSettingsPopover: HTMLButtonElement;

  private channelControls: JSX.Element[];

  constructor(props: Props) {
    super(props);
    this.channelControls = null;
    this.refBackgroundSettingsPopover = null;
  }

  componentDidMount = (): void => {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
    this.updateChannelChoices();
  };

  componentDidUpdate = (): void => {
    this.updateChannelChoices();
  };

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handleEvent = (event: Event): void => {
    if (event.detail === Toolboxes.background) {
      this[event.type]?.call(this);
    }
  };

  updateChannelChoices = (): void => {
    // Update channel controls when a new image is uploaded.
    const untickedIcon = (
      <SVG
        src={imgSrc("not-selected-tickbox-icon")}
        width="18px"
        height="auto"
      />
    );
    const tickedIcon = (
      <SVG src={imgSrc("selected-tickbox-icon")} width="18px" height="auto" />
    );
    this.channelControls = this.props.channels.map((channel, i) => (
      <Checkbox
        // className={classes.checkbox}
        checked={channel}
        icon={untickedIcon}
        checkedIcon={tickedIcon}
        onChange={() => {
          this.props.toggleChannelAtIndex(i);
        }}
      />
    ));
  };

  selectBackgroundSettings = (): void => {
    if (this.props.isTyping()) return;
    this.props.handleOpen()(this.refBackgroundSettingsPopover);
    this.props.setButtonClicked(Tools.backgroundSettings.name);
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={Tools.backgroundSettings}
        onClick={this.selectBackgroundSettings}
        fill={this.props.buttonClicked === Tools.backgroundSettings.name}
        setRefCallback={(ref) => {
          this.refBackgroundSettingsPopover = ref;
        }}
      />
      <Submenu
        isOpen={
          this.props.buttonClicked === Tools.backgroundSettings.name &&
          Boolean(this.props.anchorElement)
        }
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
        channelControls={this.channelControls}
      />
    </>
  );
}

export { Toolbar };
