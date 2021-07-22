import {
  ChangeEvent,
  ReactElement,
  useEffect,
  useState,
  MouseEvent,
} from "react";

import {
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormControl,
  Popover,
  Card,
  Paper,
  Avatar,
  makeStyles,
  createStyles,
  Theme,
} from "@material-ui/core";
import SVG from "react-inlinesvg";

import { BaseSlider } from "@/components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";

import { useBackgroundStore } from "./Store";

interface Props {
  anchorElement: HTMLElement | null;
  buttonClicked: string;
  onClose: (event: MouseEvent) => void;
  channels: boolean[];
  toggleChannelAtIndex: (index: number) => void;
  displayedImage: ImageBitmap;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    checkbox: {
      marginLeft: "104px",
    },
    contrastSlider: {
      width: "63px",
      height: "335px",
    },
    brightnessSlider: {
      width: "63px",
      height: "335px",
    },
    channelCard: {
      width: "189px",
      height: "176px",
    },
    channelTypography: {
      display: "inline",
      fontSize: "21px",
      marginRight: "54px",
      marginLeft: "3px",
    },
    channelAvatar: {
      backgroundColor: theme.palette.primary.main,
      display: "inline",
    },
    channelformGroup: {
      margin: "0",
      padding: "0",
      marginLeft: "17px",
    },
    channelPaper: {
      padding: "10px",
      backgroundColor: theme.palette.primary.main,
      width: "189px",
      marginBottom: "15px",
    },
  })
);

const Toolbar = (props: Props): ReactElement => {
  const [background, setBackground] = useBackgroundStore();
  const [channelControls, setChannelControls] = useState<JSX.Element[]>([]);
  const classes = useStyles();

  function changeContrast(e: ChangeEvent, value: number) {
    setBackground({
      contrast: value,
      brightness: background.brightness,
    });
  }

  function changeBrightness(e: ChangeEvent, value: number) {
    setBackground({
      brightness: value,
      contrast: background.contrast,
    });
  }

  const isOpen = () =>
    (props.buttonClicked === "Channels" ||
      props.buttonClicked === "Brightness" ||
      props.buttonClicked === "Contrast") &&
    Boolean(props.anchorElement);

  useEffect(() => {
    // Update channel controls when a new image is uploaded.
    const untickedIcon = (
      <SVG
        src={require("../../assets/not-selected-tickbox-icon.svg") as string}
        width="18px"
        height="auto"
      />
    );
    const tickedIcon = (
      <SVG
        src={require("../../assets/selected-tickbox-icon.svg") as string}
        width="18px"
        height="auto"
      />
    );
    setChannelControls(
      props.channels.map((channel, i) => (
        <Checkbox
          className={classes.checkbox}
          checked={channel}
          icon={untickedIcon}
          checkedIcon={tickedIcon}
          onChange={() => {
            props.toggleChannelAtIndex(i);
          }}
        />
      ))
    );
  }, [props.displayedImage]);

  return props.displayedImage ? (
    <>
      <Popover
        open={isOpen()}
        anchorEl={props.anchorElement}
        onClose={props.onClose}
      >
        {props.buttonClicked === "Contrast" && (
          <div className={classes.contrastSlider}>
            <BaseSlider
              value={background.contrast}
              config={SLIDER_CONFIG[Sliders.contrast]}
              onChange={() => changeContrast}
            />
          </div>
        )}

        {props.buttonClicked === "Brightness" && (
          <div className={classes.brightnessSlider}>
            <BaseSlider
              value={background.brightness}
              config={SLIDER_CONFIG[Sliders.brightness]}
              onChange={() => changeBrightness}
            />
          </div>
        )}

        {props.buttonClicked === "Channels" && (
          <Card className={classes.channelCard}>
            <Paper
              elevation={0}
              variant="outlined"
              square
              className={classes.channelPaper}
            >
              <Typography className={classes.channelTypography}>
                Channels
              </Typography>
              <Avatar className={classes.channelAvatar}>
                <SVG
                  src={require("../../assets/pin-icon.svg") as string}
                  width="18px"
                  height="auto"
                />
              </Avatar>
            </Paper>
            <FormControl component="fieldset">
              <FormGroup aria-label="position" row>
                {channelControls.map((control, i) => (
                  <FormControlLabel
                    key={`C${i + 1}`}
                    value="top"
                    control={control}
                    label={`C${i + 1}`}
                    labelPlacement="start"
                    className={classes.channelformGroup}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Card>
        )}
      </Popover>
    </>
  ) : null;
};

export { Toolbar };
