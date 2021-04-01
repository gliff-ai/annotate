import { Config } from "@/components/BaseSlider";

export enum Sliders {
  contrast,
  brightness,
}

export const SLIDER_CONFIG: {
  [id: number]: Config;
} = {
  [Sliders.contrast]: {
    name: "contrast",
    id: "contrast-slider",
    initial: 100,
    step: 1,
    min: 0,
    max: 200,
    unit: "%",
  },

  [Sliders.brightness]: {
    name: "brightness",
    id: "brightness-slider",
    initial: 100,
    step: 1,
    min: 0,
    max: 200,
    unit: "%",
  },
  
} as const;