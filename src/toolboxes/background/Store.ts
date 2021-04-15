import { createStore } from "@/store";
import { SLIDER_CONFIG, Sliders } from "./configSlider";

interface BackgroundData {
  contrast: number;
  brightness: number;
  //channels: boolean[];
}

const defaultBackground: BackgroundData = {
  brightness: SLIDER_CONFIG[Sliders.brightness].initial,
  contrast: SLIDER_CONFIG[Sliders.contrast].initial,
  //channels: [true, true, true], // All channels selected
};

// we've created store with initial value. This can now be used anywhere and will share the value.
export const [useBackgroundStore] = createStore(defaultBackground);
