import { createStore } from "@/store";

interface PaintbrushData {
  brushRadius: number;
}

const defaultPaintbrush: PaintbrushData = { brushRadius: 10 };

// we've created store with initial value. This can now be used anywhere and will share the value.
export const [usePaintbrushStore] = createStore(defaultPaintbrush);
