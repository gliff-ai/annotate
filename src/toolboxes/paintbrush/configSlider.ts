import { Config } from "@/components/BaseSlider";

export enum Sliders {
  brushRadius,
}

export const SLIDER_CONFIG: {
  [id: number]: Config;
} = {
  [Sliders.brushRadius]: {
    name: "brushRadius",
    id: "brush-radius-slider",
    initial: 10,
    step: 1,
    min: 1,
    max: 20,
    unit: "px",
  },
} as const;
