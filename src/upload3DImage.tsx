import React, { Component, ReactNode } from "react";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import BackupIcon from "@material-ui/icons/Backup";
import * as UTIF from "utif";
import ImageFileInfo from "./ImageFileInfo";

interface Props {
  imageFile?: File;
  setImageSlicesData: (data: Array<Uint8Array | Uint8ClampedArray>) => void;
}
export default class Upload3DImage extends Component<Props> {
  private imageFileInfo: ImageFileInfo;
  private imageSlicesData: Array<Uint8Array | Uint8ClampedArray>;

  constructor(props: Props) {
    super(props);
  }

  private uploadImage = (imageFile: File): void => {
    this.readFile(imageFile)
      .then((buffer: ArrayBuffer) => {
        this.imageFileInfo = new ImageFileInfo(imageFile.name);
        this.loadImageFile(buffer); // load the image file
      })
      .catch((error) => console.log(error));
  };

  private readFile = (file: File) => {
    return new Promise((resolve: (buffer: ArrayBuffer) => void) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result as ArrayBuffer);
      };
      fr.readAsArrayBuffer(file);
    }).catch((error) => console.log(error));
  };

  private loadImageFile = (buffer: ArrayBuffer): void => {
    // Decode the images using the UTIF library.
    const ifds = UTIF.decode(buffer);
    for (const ifd of ifds) {
      UTIF.decodeImage(buffer, ifd);
    }

    const width = ifds[0].width;
    const height = ifds[0].height;

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
      this.imageSlicesData = [];

      // Loop through each slice
      for (let i = 0; i < ifds.length / extraChannels; i++) {
        // Allocate a buffer for this slice
        const rgba = new Uint8ClampedArray(width * height * 4);

        // For each channel, copy the data for the right IFD into the buffer
        for (let j = 0; j < extraChannels; j++) {
          // For some reason, it seems that the channels are inverted
          const srcj = extraChannels - 1 - j;
          const component = UTIF.toRGBA8(ifds[i * extraChannels + srcj]);
          // The single channel will be stored in the green component.
          for (let k = 0; k < width * height; k++) {
            rgba[4 * k + j] = component[4 * k + 1];
          }
        }

        // Set the alpha value to opaque.
        for (let k = 0; k < width * height; k++) {
          rgba[4 * k + 3] = 255;
        }

        // Push the slice onto our image stack.
        this.imageSlicesData.push(rgba);
      }
    } else {
      // Build a list of images (as canvas) that
      // can be draw onto a canvas.
      this.imageSlicesData = ifds.map(UTIF.toRGBA8).map((rgba) => rgba);
    }

    this.imageFileInfo.slices = this.imageSlicesData.length;
    this.imageFileInfo.width = width;
    this.imageFileInfo.height = height;
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

  render = (): ReactNode => {
    return (
      <div style={{ textAlign: "center" }}>
        <input
          accept="image/*"
          id="icon-button-file"
          type="file"
          style={{ display: "none", textAlign: "center" }}
          onChange={(e) => {
            console.log(e.target.files[0]);
            this.uploadImage(e.target.files[0]);
            this.props.setImageSlicesData(this.imageSlicesData);
            console.log(this.imageSlicesData);
          }}
        />
        <label htmlFor="icon-button-file">
          <IconButton aria-label="upload picture" component="span">
            <BackupIcon />
          </IconButton>
        </label>
      </div>
    );
  };
}
