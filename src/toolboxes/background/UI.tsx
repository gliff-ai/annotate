import React, { ChangeEvent, ReactElement } from "react";
import {
  Grid,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  FormControl,
} from "@material-ui/core";

import { ExpandMore } from "@material-ui/icons";

import { BaseSlider } from "@/components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";

import { useBackgroundStore } from "./Store";

interface Props {
  expanded: boolean;
  onChange: (event: ChangeEvent, isExpanded: boolean) => void;
}

const BackgroundUI = (props: Props): ReactElement => {
  const [background, setBackground] = useBackgroundStore();

  function changeContrast(e: ChangeEvent, value: number) {
    setBackground({
      contrast: value,
      brightness: background.brightness,
      channels: background.channels,
    });
  }

  function changeBrightness(e: ChangeEvent, value: number) {
    setBackground({
      brightness: value,
      contrast: background.contrast,
      channels: background.channels,
    });
  }

  function changeChannels(red = true, green = true, blue = true): void {
    setBackground({
      brightness: background.brightness,
      contrast: background.contrast,
      channels: [red, green, blue],
    });
  }

  return (
    <Accordion expanded={props.expanded} onChange={props.onChange}>
      <AccordionSummary expandIcon={<ExpandMore />} id="background-toolbox">
        <Typography>Background</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={0} justify="center" wrap="nowrap">
          <Grid item style={{ width: "85%", position: "relative" }}>
            <BaseSlider
              value={background.contrast}
              config={SLIDER_CONFIG[Sliders.contrast]}
              onChange={() => changeContrast}
            />
            <BaseSlider
              value={background.brightness}
              config={SLIDER_CONFIG[Sliders.brightness]}
              onChange={() => changeBrightness}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">Channels</FormLabel>
              <FormGroup aria-label="position" row={true}>
                <FormControlLabel
                  value="top"
                  control={
                    <Checkbox
                      checked={background.channels[0]}
                      onChange={() => {
                        changeChannels(
                          !background.channels[0],
                          background.channels[1],
                          background.channels[2]
                        );
                      }}
                    />
                  }
                  label="R"
                  labelPlacement="top"
                  style={{ margin: "0", padding: "0" }}
                />
                <FormControlLabel
                  value="top"
                  control={
                    <Checkbox
                      checked={background.channels[1]}
                      onChange={() => {
                        changeChannels(
                          background.channels[0],
                          !background.channels[1],
                          background.channels[2]
                        );
                      }}
                    />
                  }
                  label="G"
                  labelPlacement="top"
                  style={{ margin: "0", padding: "0" }}
                />
                <FormControlLabel
                  value="top"
                  control={
                    <Checkbox
                      checked={background.channels[2]}
                      onChange={() => {
                        changeChannels(
                          background.channels[0],
                          background.channels[1],
                          !background.channels[2]
                        );
                      }}
                    />
                  }
                  label="B"
                  labelPlacement="top"
                  style={{ margin: "0", padding: "0" }}
                />
              </FormGroup>
            </FormControl>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export { BackgroundUI };
