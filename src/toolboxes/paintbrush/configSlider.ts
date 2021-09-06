import { Config } from "@/components/BaseSlider";

export enum Sliders {
  brushRadius,
  annotationAlpha,
  annotationActiveAlpha,
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
  [Sliders.annotationAlpha]: {
    name: "annotationAlpha",
    id: "annotationAlpha-slider",
    initial: 50,
    step: 1,
    min: 0,
    max: 100,
    unit: "%",
  },
  [Sliders.annotationActiveAlpha]: {
    name: "annotationActiveAlpha",
    id: "annotationActiveAlpha-slider",
    initial: 100,
    step: 1,
    min: 0,
    max: 100,
    unit: "%",
  },
} as const;
