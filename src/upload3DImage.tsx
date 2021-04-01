import React, { Component, ReactNode } from "react";
import Button from "@material-ui/core/Button";
import BackupIcon from "@material-ui/icons/Backup";
import * as UTIF from "utif";
import ImageFileInfo from "./ImageFileInfo";

interface Props {
  setUploadedImage: (
    slicesData: Array<ImageData>,
    imageFileInfo: ImageFileInfo
  ) => void;
}

export default class Upload3DImage extends Component<Props> {
  private imageFileInfo: ImageFileInfo | null;

  private slicesData: Array<ImageData>;

  constructor(props: Props) {
    super(props);
    this.imageFileInfo = null;
  }

  private uploadImage = (imageFile: File): void => {
    this.readFile(imageFile)
      .then((buffer: ArrayBuffer) => {
        this.imageFileInfo = new ImageFileInfo(imageFile.name);
        this.loadImageFile(buffer);
      })
      .catch((error) => {});
  };

  private readFile = (file: File) =>
    new Promise((resolve: (buffer: ArrayBuffer) => void) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result as ArrayBuffer);
      };
      fr.readAsArrayBuffer(file);
    }).catch((error) => {});

  private loadImageFile = (buffer: ArrayBuffer): void => {
    // Decode the images using the UTIF library.
    const ifds = UTIF.decode(buffer);
    for (const ifd of ifds) {
      UTIF.decodeImage(buffer, ifd);
    }

    const { width, height } = ifds[0];

    const resolutionUnitstr = ifds[0].t296 as string[];

    if (resolutionUnitstr !== null && resolutionUnitstr.length === 1) {
      const resolutionUnit = parseInt(resolutionUnitstr[0], 10);

      const resolutionXstr = ifds[0].t282 as string[];
      const resolutionYstr = ifds[0].t283 as string[];

      if (resolutionXstr !== null && resolutionXstr.length === 1) {
        this.imageFileInfo.resolution_x = parseFloat(resolutionXstr[0]);
      }
      if (resolutionYstr !== null && resolutionYstr.length === 1) {
        this.imageFileInfo.resolution_y = parseFloat(resolutionYstr[0]);
      }

      // There is no reliable way of detecting the Z resolution.
      // If the resolution unit is 1, assume that everything has been scaled
      // according to the Z resolution (i.e resolutionZ = 1)
      // else assume that the Z resolution is the same as the X resolution.
      if (resolutionUnit !== 1) {
        this.imageFileInfo.resolution_y = this.imageFileInfo.resolution_x;
      }
    }

    const descriptions = ifds[0].t270 as string[];
    const extraChannels = this.getNumberOfExtraChannels(descriptions);

    if (extraChannels !== 0) {
      this.slicesData = [];

      // Loop through each slice
      for (let i = 0; i < ifds.length / extraChannels; i += 1) {
        // Allocate a buffer for this slice
        const rgba = new Uint8ClampedArray(width * height * 4);

        // For each channel, copy the data for the right IFD into the buffer
        for (let j = 0; j < extraChannels; j += 1) {
          // For some reason, it seems that the channels are inverted
          const srcj = extraChannels - 1 - j;
          const component = UTIF.toRGBA8(ifds[i * extraChannels + srcj]);
          // The single channel will be stored in the green component.
          for (let k = 0; k < width * height; k += 1) {
            rgba[4 * k + j] = component[4 * k + 1];
          }
        }

        // Set the alpha value to opaque.
        for (let k = 0; k < width * height; k += 1) {
          rgba[4 * k + 3] = 255;
        }

        // Push the slice onto our image stack.
        this.slicesData.push(
          new ImageData(Uint8ClampedArray.from(rgba), width, height)
        );
      }
    } else {
      // Build a list of images (as canvas) that
      // can be draw onto a canvas.
      this.slicesData = ifds
        .map(UTIF.toRGBA8)
        .map(
          (rgba) => new ImageData(Uint8ClampedArray.from(rgba), width, height)
        );
    }

    this.imageFileInfo.width = width;
    this.imageFileInfo.height = height;

    this.props.setUploadedImage(this.slicesData, this.imageFileInfo);
  };

  private getNumberOfExtraChannels = (descriptions: string[]): number => {
    // Get the number of extra channels in the uploaded tiff image
    let extraChannels = 0;
    if (descriptions !== undefined && descriptions.length === 1) {
      const description = descriptions[0];

      if (description !== null && description.includes("channels=")) {
        // Image-J extension:
        // Image-J stores various parameters in the image description.
        // As such, it stores the number of channels inside the description and
        // store each individual channel in a separate IFD.

        const descChannelsIdx = description.indexOf("channels=") + 9;
        const descChannelsEnd = description.indexOf("\n", descChannelsIdx);
        extraChannels = parseInt(
          description.slice(descChannelsIdx, descChannelsEnd),
          10
        );
      }
    }
    return extraChannels;
  };

  render = (): ReactNode => (
    <div style={{ textAlign: "center" }}>
      <label htmlFor="icon-button-file">
        <input
          accept="image/*"
          id="icon-button-file"
          type="file"
          style={{ display: "none", textAlign: "center" }}
          onChange={(e) => {
            this.uploadImage(e.target.files[0]);
          }}
        />
        <Button aria-label="upload-picture" component="span">
          <BackupIcon />
        </Button>
      </label>
    </div>
  );
}
