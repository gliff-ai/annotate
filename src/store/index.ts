// Based on https://github.com/pie6k/hooksy
import { useState, useCallback, useLayoutEffect } from "react";

interface StoreListeningComponentData<T> {
  update: () => void;
  options?: UseStoreStateOptions<T>;
}

export interface UseStoreStateOptions<T> {
  shouldUpdate?: (oldState: T, newState: T) => boolean;
}

type UpdateState<T> = readonly [T, (newStoreState: T) => void];

function useForceUpdate(): () => void {
  const [, updateComponent] = useState<Record<string, unknown>>({});

  return useCallback(() => {
    updateComponent({});
  }, []);
}

function removeArrayElement<T>(arr: T[], elem: T): void {
  const index = arr.indexOf(elem);

  if (index === -1) {
    return;
  }

  arr.splice(index, 1);
}

export function createStore<T>(
  defaultValue: T
): readonly [
  (options?: UseStoreStateOptions<T>) => UpdateState<T>,
  (newStoreState: T) => void
] {
  let storeState = defaultValue;
  const storeListeningComponents: StoreListeningComponentData<T>[] = [];

  function updateStoreState(newStoreState: T): void {
    const oldStoreState = storeState;
    storeState = newStoreState;

    storeListeningComponents.forEach(({ update, options }) => {
      const shouldUpdate = options?.shouldUpdate?.(
        oldStoreState,
        newStoreState
      );

      if (!shouldUpdate) {
        return;
      }

      update();
    });
  }

  function useStoreState(options?: UseStoreStateOptions<T>): UpdateState<T> {
    const forceUpdate = useForceUpdate();

    useLayoutEffect(() => {
      const listeningData: StoreListeningComponentData<T> = {
        options,
        update: forceUpdate,
      };

      storeListeningComponents.push(listeningData);

      return () => {
        removeArrayElement(storeListeningComponents, listeningData);
      };
    });

    return [storeState, updateStoreState] as const;
  }

  return [useStoreState, updateStoreState] as const;
}
