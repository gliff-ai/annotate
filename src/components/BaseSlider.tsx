import React, { ChangeEvent, FunctionComponent, ReactElement } from "react";
import { Typography, Slider } from "@material-ui/core";

export enum Sliders {
  contrast,
  brightness,
}

export const sliderConfig: {
  [id: number]: SliderConfigItem;
} = {
  [Sliders.contrast]: {
    name: "contrast",
    initial: 100,
    min: 0,
    max: 200,
  },

  [Sliders.brightness]: {
    name: "brightness",
    initial: 100,
    min: 0,
    max: 200,
  },
};

interface SliderConfigItem {
  name: string;
  initial: number;
  min: number;
  max: number;
}

interface Props {
  value: number;
  onChange: (arg0: string) => (arg1: ChangeEvent, arg2: number) => void;
  slider: Sliders;
}

export const BaseSlider: FunctionComponent<Props> = ({
  value,
  slider,
  onChange,
}): ReactElement => {
  const config = sliderConfig[slider];
  return (
    <>
      <Typography
        id="continuous-slider"
        gutterBottom
        style={{ textTransform: "capitalize" }}
      >
        {config.name}
      </Typography>
      <Slider
        value={value}
        onChange={onChange(config.name)}
        min={config.min}
        max={config.max}
        aria-labelledby="continuous-slider"
        valueLabelDisplay="auto"
      />
    </>
  );
};
