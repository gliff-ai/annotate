// We use this to run an effect once on load.
// It satifies the linter while still catching places we pass an empty array by accident

import { useEffect } from "react";

// eslint-disable-next-line react-hooks/exhaustive-deps
const useMountEffect = (fn: () => void): void => useEffect(fn, []);

export { useMountEffect };
