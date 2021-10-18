import { ChangeEvent, ReactElement } from "react";
import { Input, makeStyles, Slider } from "@material-ui/core";

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
  onChange: (arg0: string) => (arg1: ChangeEvent, arg2: number) => void;
  sliderHeight?: string;
  showEndValues?: boolean;
}

function getAriaValueText(value: number): string {
  return `${value}`;
}

const useStyles = () =>
  makeStyles({
    value: {
      width: "42px",
      height: "42px",
      border: "1px solid #02FFAD",
      borderRadius: "9px",
      textAlign: "center",
      padding: "10px 0",
      margin: "10px 20px 10px 10px",
    },
    slider: {
      marginLeft: "10px",
      width: "180px",
    },
    maxSliderValue: {
      marginBottom: "18px",
    },
  });

export const BaseSlider = ({
  value,
  config,
  onChange,
  showEndValues,
}: Props): ReactElement => {
  const classes = useStyles()();

  const marks = [
    {
      value: 0,
      label: `${config.min}`,
    },
    {
      value: 40,
      label: `${config.max}`,
    },
  ];

  return (
    <>
      <div className={classes.value}>{`${value}`}</div>
      <div className={classes.slider}>
        <Slider
          color="primary"
          orientation="horizontal"
          value={value}
          onChange={onChange(config.name)}
          aria-labelledby={config.id}
          step={config.step}
          min={config.min}
          max={config.max}
          getAriaValueText={getAriaValueText}
          marks={marks}
        />
      </div>
    </>
  );
};

BaseSlider.defaultProps = {
  sliderHeight: null,
  showEndValues: true,
};
