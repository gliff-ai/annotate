interface PluginElement {
  name: string;
  tooltip: string;
  onClick: (data: DataIn) => Promise<DataOut>;
}

interface DataIn {
  collectionUid?: string;
  imageUid?: string;
}

interface DataOut {
  status?: string;
  message?: string;
  domElement?: JSX.Element | null;
}

type PluginObject = { [name: string]: PluginElement[] };

export type { PluginElement, PluginObject };
