import React, { ChangeEvent, ReactElement } from "react";
import { makeStyles, Slider } from "@material-ui/core";

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
  sliderHeight?: string;
  showEndValues?: boolean;
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
      margin: "auto",
      textAlign: "center",
      padding: "10px 0",
      marginTop: "10px",
      marginBottom: "20px",
    },
    slider: {
      textAlign: "center",
      height: sliderHeight || "204px",
      marginBottom: "18px",
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
  showEndValues,
}: Props): ReactElement => {
  const classes = useStyles(sliderHeight)();

  return (
    <>
      <div className={classes.value}>{`${value}`}</div>
      <div className={classes.slider}>
        <div className={classes.maxSliderValue}>
          {showEndValues ? `${config.max}${config.unit}` : null}
        </div>
        <Slider
          color="primary"
          orientation="vertical"
          value={value}
          onChange={onChange(config.name)}
          aria-labelledby={config.id}
          step={config.step}
          min={config.min}
          max={config.max}
          getAriaValueText={getAriaValueText}
        />
        <div>{showEndValues ? `${config.min}${config.unit}` : null}</div>
      </div>
    </>
  );
};

BaseSlider.defaultProps = {
  sliderHeight: null,
  showEndValues: true,
};
