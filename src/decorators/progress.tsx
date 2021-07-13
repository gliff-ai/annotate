import { UI } from "../ui";

interface Descriptor extends Omit<PropertyDescriptor, "value"> {
  value?: (...args: unknown[]) => unknown;
}

function pageLoading(
  target: UI,
  propertyKey: string,
  descriptor: Descriptor
): void {
  const targetMethod = descriptor.value;

  descriptor.value = async function decoratorWrapper(...args) {
    const setIsLoading = (this as UI).props?.setIsLoading;

    await targetMethod.apply(this, args);

    if (typeof setIsLoading === "function") {
      setIsLoading(false);
    }
  };
}

export { pageLoading };
