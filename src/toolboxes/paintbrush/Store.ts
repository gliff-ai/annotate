import { createStore } from "@/store";
import { Tools } from "./Toolbox";
import { SLIDER_CONFIG, Sliders } from "./configSlider";

// types will include: paintbrush, eraser
interface PaintbrushData {
  brushType: string;
  brushRadius: number;
  annotationAlpha: number;
  annotationActiveAlpha: number;
}

const defaultPaintbrush: PaintbrushData = {
  brushType: Tools.paintbrush.name,
  brushRadius: SLIDER_CONFIG[Sliders.brushRadius].initial,
  annotationAlpha: SLIDER_CONFIG[Sliders.annotationAlpha].initial,
  annotationActiveAlpha: SLIDER_CONFIG[Sliders.annotationActiveAlpha].initial,
};

// we've created store with initial value. This can now be used anywhere and will share the value.
export const [usePaintbrushStore] = createStore(defaultPaintbrush);
