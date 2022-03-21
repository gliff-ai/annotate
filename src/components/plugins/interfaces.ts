import { ImageFileInfo } from "@gliff-ai/upload";
import { Annotation } from "@/annotation/interfaces";

interface PluginElement {
  type?: string;
  name: string;
  tooltip: string;
  onClick: (data: PluginInput) => Promise<PluginOutput>;
}

type PluginObject = { [name: string]: PluginElement[] };

type PluginInput = Partial<{
  collectionUid: string;
  imageUid: string;
  imageData: ImageBitmap[][]; // image data (i.e., slicesData)
  imageFileInfo: ImageFileInfo;
  annotationData: Annotation[]; // all annotations
}>;

type PluginOutput = Partial<{
  status: string;
  message: string;
  domElement: JSX.Element | null;
  data: Partial<{
    annotationData: Annotation[]; // some new annotations
    metadata: { [key: string]: string | string[] | number | boolean }; // some new metadata
  }>;
}>;

export type { PluginElement, PluginObject, PluginOutput };
