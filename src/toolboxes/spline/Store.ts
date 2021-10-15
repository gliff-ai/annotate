import { createStore } from "@/store";

// types will include: spline, lasso, magic and box
interface SplineData {
  splineType: string;
}

const defaultSpline: SplineData = { splineType: "Spline" };

// we've created store with initial value. This can now be used anywhere and will share the value.
export const [useSplineStore] = createStore(defaultSpline);
