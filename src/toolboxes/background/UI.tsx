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
              <FormGroup aria-label="position" row>
                {controls.map((control, i) => (
                  <FormControlLabel
                    key={`C${i + 1}`}
                    value="top"
                    control={control}
                    label={`C${i + 1}`}
                    labelPlacement="top"
                    style={{ margin: "0", padding: "0" }}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export { BackgroundUI };
