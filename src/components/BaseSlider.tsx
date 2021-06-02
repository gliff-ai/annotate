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

type Marks = Array<{ value: number; label: string }>;

interface Props {
  value: number;
  config: Config;
  onChange: (arg0: string) => (arg1: ChangeEvent, arg2: number) => void;
}

function getAriaValueText(value: number): string {
  return `${value}`;
}

// function getMarks(config: Config): Marks {
//   return [config.min, config.initial, config.max].map((value) => ({
//     value,
//     label: `${value} ${config.unit}`,
//   }));
// }

export const BaseSlider: FunctionComponent<Props> = ({
  value,
  config,
  onChange,
}: Props): ReactElement => {
  // const marks = getMarks(config);
  return (
    <>
      <Typography
        id={config.id}
        gutterBottom
        style={{ textTransform: "capitalize" }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            border: "1px solid #02FFAD",
            borderRadius: "9px",
            margin: "auto",
            textAlign: "center",
            padding: "7px 0",
            marginTop: "14px",
            marginBottom: "24px",
          }}
        >
          {`${value}${config.unit}`}
        </div>
      </Typography>
      <div
        style={{ textAlign: "center", height: "204px", marginBottom: "18px" }}
      >
        <Slider
          color="primary"
          orientation="vertical"
          value={value}
          onChange={onChange(config.name)}
          aria-labelledby={config.id}
          step={config.step}
          min={config.min}
          max={config.max}
          // marks={marks}
          getAriaValueText={getAriaValueText}
          // valueLabelDisplay="auto"
        />
      </div>
    </>
  );
};
