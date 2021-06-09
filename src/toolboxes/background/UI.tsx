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

const BackgroundUI = (props: Props): ReactElement => {
  const [background, setBackground] = useBackgroundStore();

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
      style={{ marginLeft: "104px" }}
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
          <div
            style={{
              width: "63px",
              height: "335px",
            }}
          >
            <BaseSlider
              value={background.contrast}
              config={SLIDER_CONFIG[Sliders.contrast]}
              onChange={() => changeContrast}
              slider="contrast"
            />
          </div>
        )}

        {props.buttonClicked === "Brightness" && (
          <div
            style={{
              width: "63px",
              height: "335px",
            }}
          >
            <BaseSlider
              value={background.brightness}
              config={SLIDER_CONFIG[Sliders.brightness]}
              onChange={() => changeBrightness}
              slider="brightness"
            />
          </div>
        )}

        {props.buttonClicked === "Channel" && (
          <Card
            style={{
              width: "189px",
              height: "176px",
            }}
          >
            <Paper
              elevation={0}
              variant="outlined"
              square
              style={{
                padding: "10px",
                backgroundColor: "#02FFAD",
                width: "189px",
                marginBottom: "15px",
              }}
            >
              <Typography
                style={{
                  display: "inline",
                  fontSize: "21px",
                  marginRight: "54px",
                  marginLeft: "3px",
                }}
              >
                Channels
              </Typography>
              <Avatar style={{ backgroundColor: "#02FFAD", display: "inline" }}>
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
                    style={{ margin: "0", padding: "0", marginLeft: "17px" }}
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
