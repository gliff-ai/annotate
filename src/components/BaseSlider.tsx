import { ReactElement } from "react";
import { Slider } from "@mui/material";

import makeStyles from "@mui/styles/makeStyles";

export interface Config {
  name: string;
  id: string;
  initial: number;
  step: number;
  min: number;
  max: number;
  unit: string;
}
interface Props {
  value: number;
  config: Config;
  onChange: (arg0: string) => (arg1: Event, arg2: number) => void;
  sliderHeight?: string;
}

function getAriaValueText(value: number): string {
  return `${value}`;
}

const useStyles = (sliderHeight?: string) =>
  makeStyles({
    value: {
      width: "42px",
      height: "42px",
      border: "1px solid #02FFAD",
      borderRadius: "9px",
      textAlign: "center",
      padding: "10px 0",
      margin: "10px 20px 20px 10px",
    },
    slider: {
      marginLeft: "10px",
      width: "180px",
      height: sliderHeight || "194px",
      marginTop: "10px",
    },
    maxSliderValue: {
      marginBottom: "18px",
    },
  });

export const BaseSlider = ({
  value,
  config,
  onChange,
  sliderHeight,
}: Props): ReactElement => {
  const classes = useStyles(sliderHeight)();

  const marks = [
    {
      value: Number(`${config.min}`),
      label: `${config.min}`,
    },
    {
      value: Number(`${config.max}`),
      label: `${config.max}`,
    },
  ];

  return (
    <>
      <div className={classes.value}>{`${value}`}</div>
      <div className={classes.slider}>
        <Slider
          color="primary"
          orientation={config.name === "slices" ? "vertical" : "horizontal"}
          value={value}
          onChange={onChange(config.name)}
          aria-labelledby={config.id}
          step={config.step}
          min={config.min}
          max={config.max}
          getAriaValueText={getAriaValueText}
          marks={marks}
          size="small"
          sx={{ height: "100%" }}
        />
      </div>
    </>
  );
};

BaseSlider.defaultProps = {
  sliderHeight: null,
};
