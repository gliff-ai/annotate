import React, { ChangeEvent, ReactElement } from "react";
import {
  Grid,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  FormControl,
  Popover,
  Card,
  Paper,
  Avatar,
} from "@material-ui/core";
import SVG, { Props as SVGProps } from "react-inlinesvg";

import { BaseSlider } from "@/components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";

import { useBackgroundStore } from "./Store";

interface Props {
  open: boolean;
  anchorEl: any;
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
        <div
          style={{
            width: "63px",
            height: "297px",
          }}
        >
          {props.buttonClicked === "Contrast" && (
            <BaseSlider
              value={background.contrast}
              config={SLIDER_CONFIG[Sliders.contrast]}
              onChange={() => changeContrast}
            />
          )}

          {props.buttonClicked === "Brightness" && (
            <BaseSlider
              value={background.brightness}
              config={SLIDER_CONFIG[Sliders.brightness]}
              onChange={() => changeBrightness}
            />
          )}
        </div>

        {props.buttonClicked === "Channel" && (
          <Card
            style={{
              width: "271px",
              height: "375px",
            }}
          >
            <Paper
              elevation={0}
              variant="outlined"
              square
              style={{
                padding: "10px",
                backgroundColor: "#02FFAD",
                width: "271px",
              }}
            >
              <Typography
                style={{
                  display: "inline",
                  fontSize: "21px",
                  marginRight: "125px",
                }}
              >
                Channels
              </Typography>
              <Avatar style={{ backgroundColor: "#02FFAD", display: "inline" }}>
                <SVG
                  src="./src/assets/pin-icon.svg"
                  width="18px"
                  height="auto"
                />
              </Avatar>
            </Paper>
          </Card>
        )}
      </Popover>
    </>
  );
};

export { BackgroundUI };
