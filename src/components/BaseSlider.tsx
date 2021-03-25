import React, { ChangeEvent, FunctionComponent, ReactElement } from "react";
import { Slider, Typography } from "@material-ui/core";

export interface Config {
  name: string;
  id: string;
  initial: number;
  step: number;
  min: number;
  max: number;
  unit: string;
}

type marks = Array<{ value: number; label: string }>;
interface Props {
  value: number;
  config: Config;
  onChange: (arg0: string) => (arg1: ChangeEvent, arg2: number) => void;
}

function getAriaValueText(value: number): string {
  return `${value}`;
}

function getMarks(config: Config): marks {
  return [config.min, config.initial, config.max].map((value) => ({
    value,
    label: `${value} ${config.unit}`,
  }));
}

export const BaseSlider: FunctionComponent<Props> = ({
  value,
  config,
  onChange,
}): ReactElement => {
  const marks = getMarks(config);
  return (
    <>
      <Typography
        id={config.id}
        gutterBottom
        style={{ textTransform: "capitalize" }}
      >
        {config.name}
      </Typography>
      <Slider
        value={value}
        onChange={onChange(config.name)}
        aria-labelledby={config.id}
        step={config.step}
        min={config.min}
        max={config.max}
        marks={marks}
        getAriaValueText={getAriaValueText}
        valueLabelDisplay="auto"
      />
    </>
  );
};
