import React, { ChangeEvent, FunctionComponent, ReactElement } from "react";
import { Slider } from "@material-ui/core";

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
  slider: string;
}

function getAriaValueText(value: number): string {
  return `${value}`;
}

export const BaseSlider: FunctionComponent<Props> = ({
  value,
  config,
  onChange,
  slider,
}: Props): ReactElement => (
  <>
    <div
      style={{
        width: "42px",
        height: "42px",
        border: "1px solid #02FFAD",
        borderRadius: "9px",
        margin: "auto",
        textAlign: "center",
        padding: "10px 0",
        marginTop: "10px",
        marginBottom: "20px",
      }}
    >
      {`${value}`}
    </div>

    <div style={{ textAlign: "center", height: "204px", marginBottom: "18px" }}>
      <div>
        {slider === "brightness" || slider === "contrast"
          ? `${config.max}${config.unit}`
          : null}
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
      <div>
        {slider === "brightness" || slider === "contrast"
          ? `${config.min}${config.unit}`
          : null}
      </div>
    </div>
  </>
);
