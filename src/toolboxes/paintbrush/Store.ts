import { createStore } from "@/store";
import { tooltips } from "@/components/tooltips";

// types will include: paintbrush, eraser
interface PaintbrushData {
  brushType: string;
  brushRadius: number;
}

const defaultPaintbrush: PaintbrushData = {
  brushType: tooltips.paintbrush.name,
  brushRadius: 10,
};

// we've created store with initial value. This can now be used anywhere and will share the value.
export const [usePaintbrushStore] = createStore(defaultPaintbrush);
