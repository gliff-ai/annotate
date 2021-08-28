import { createStore } from "@/store";
import { Tools } from "./Toolbox";

// types will include: paintbrush, eraser
interface PaintbrushData {
  brushType: string;
  brushRadius: number;
}

const defaultPaintbrush: PaintbrushData = {
  brushType: Tools.paintbrush.name,
  brushRadius: 10,
};

// we've created store with initial value. This can now be used anywhere and will share the value.
export const [usePaintbrushStore] = createStore(defaultPaintbrush);
