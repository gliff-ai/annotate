import React, { ChangeEvent, ReactElement } from "react";
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
  open: boolean;
  anchorEl: HTMLElement | null;
  buttonClicked: string;
  onClose: (event: React.MouseEvent) => void;
  channels: boolean[];
  toggleChannelAtIndex: (index: number) => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    checkbox: {
      marginLeft: "104px",
    },
    contrastBaseslider: {
      width: "63px",
      height: "335px",
    },
    brightnessBaseslider: {
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

const BackgroundUI = (props: Props): ReactElement => {
  const [background, setBackground] = useBackgroundStore();
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

  const controls = props.channels.map((channel, i) => (
    <Checkbox
      className={classes.checkbox}
      checked={channel}
      icon={
        <SVG
          src={require("../../assets/not-selected-tickbox-icon.svg") as string}
          width="18px"
          height="auto"
        />
      }
      checkedIcon={
        <SVG
          src={require("../../assets/selected-tickbox-icon.svg") as string}
          width="18px"
          height="auto"
        />
      }
      onChange={() => {
        props.toggleChannelAtIndex(i);
      }}
    />
  ));

  return (
    <>
      <Popover
        open={props.open}
        anchorEl={props.anchorEl}
        onClose={props.onClose}
      >
        {props.buttonClicked === "Contrast" && (
          <div className={classes.contrastBaseslider}>
            <BaseSlider
              value={background.contrast}
              config={SLIDER_CONFIG[Sliders.contrast]}
              onChange={() => changeContrast}
              slider="contrast"
            />
          </div>
        )}

        {props.buttonClicked === "Brightness" && (
          <div className={classes.brightnessBaseslider}>
            <BaseSlider
              value={background.brightness}
              config={SLIDER_CONFIG[Sliders.brightness]}
              onChange={() => changeBrightness}
              slider="brightness"
            />
          </div>
        )}

        {props.buttonClicked === "Channel" && (
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
                {controls.map((control, i) => (
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
  );
};

export { BackgroundUI };
