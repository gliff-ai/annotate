import { Annotation } from "@/annotation/interfaces";

function exportAsJson(annotations: Annotation[], exportFileName: string) {
  const contentType = "application/json;charset=utf-8;";
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    const blob = new Blob(
      [decodeURIComponent(encodeURI(JSON.stringify(annotations)))],
      { type: contentType }
    );
    navigator.msSaveOrOpenBlob(blob, exportFileName);
  } else {
    const a = document.createElement("a");
    a.download = exportFileName;
    a.href = `data:${contentType},${encodeURIComponent(
      JSON.stringify(annotations)
    )}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function downloadAnnotationsAsJson(
  annotations: Annotation[],
  selectedToolbox: string,
  fileName: string
): void {
  const filteredAnnotations = annotations.filter(
    ({ toolbox }) => toolbox === selectedToolbox
  );
  const name = fileName.split(".").shift();
  const exportFileName = `${name}_${selectedToolbox}.json`;
  exportAsJson(filteredAnnotations, exportFileName);
}
