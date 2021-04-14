import React, { Component, ReactNode } from "react";
import Button from "@material-ui/core/Button";
import BackupIcon from "@material-ui/icons/Backup";
import * as UTIF from "utif";
import ImageFileInfo from "./ImageFileInfo";

interface Props {
  setUploadedImage: (
    imageFileInfo: ImageFileInfo,
    slicesData?: Array<Array<Uint8ClampedArray>>
  ) => void;
}

export default class Upload3DImage extends Component<Props> {
  private imageFileInfo: ImageFileInfo | null;

  private slicesData: Array<Array<Uint8ClampedArray>>;

  constructor(props: Props) {
    super(props);
    this.imageFileInfo = null;
  }

  private uploadImage = (imageFile: File): void => {
    this.readFile(imageFile)
      .then((buffer: ArrayBuffer) => {
        this.imageFileInfo = new ImageFileInfo(imageFile.name);
        this.loadImageFile(buffer).catch((error) => {
          console.log(error);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  private readFile = (file: File) =>
    new Promise((resolve: (buffer: ArrayBuffer) => void) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result as ArrayBuffer);
      };
      fr.readAsArrayBuffer(file);
    }).catch((error) => {
      console.log(error);
    });

  private loadImageFile = async (buffer: ArrayBuffer): Promise<void> => {
    // Decode the images using the UTIF library.
    const ifds = UTIF.decode(buffer);
    for (const ifd of ifds) {
      UTIF.decodeImage(buffer, ifd);
    }

    const { width, height } = ifds[0];

    const resolutionUnitstr = ifds[0].t296 as string[];

    // set this.imageFileInfo.resolution_x and resolution_y:
    if (resolutionUnitstr !== undefined && resolutionUnitstr.length === 1) {
      const resolutionUnit = parseInt(resolutionUnitstr[0], 10);

      const resolutionXstr = ifds[0].t282 as string[];
      const resolutionYstr = ifds[0].t283 as string[];

      if (resolutionXstr !== undefined && resolutionXstr.length === 1) {
        this.imageFileInfo.resolution_x = parseFloat(resolutionXstr[0]);
      }
      if (resolutionYstr !== undefined && resolutionYstr.length === 1) {
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
    const channels = this.getNumberOfChannels(descriptions);

    const slices = ifds.length / channels;
    this.slicesData = [];

    // Loop through each slice
    for (let i = 0; i < slices; i += 1) {
      // Allocate a buffer for this slice
      this.slicesData.push(new Array<Uint8ClampedArray>());

      // For each channel, copy the corresponding ifd data into a new ImageBitmap
      for (let j = 0; j < channels; j += 1) {
        // For some reason, it seems that the channels are inverted
        const srcj = channels - 1 - j;

        // extract data from the ifd for this channelslice into an RGBA 8bit array (will be greyscale, R==G==B):
        const sliceChannelRGBA8 = UTIF.toRGBA8(ifds[i * channels + srcj]);

        // read the red channel of sliceChannelRGBA8 into a new Uint8ClampedArray (discarding redundant channels):
        const sliceChannel = new Uint8ClampedArray(width * height);
        for (let k = 0; k < width * height; k += 1) {
          sliceChannel[k] = sliceChannelRGBA8[4 * k];
        }

        this.slicesData[i][j] = sliceChannel;
      }
    }

    this.imageFileInfo.width = width;
    this.imageFileInfo.height = height;

    this.props.setUploadedImage(this.imageFileInfo, this.slicesData);
  };

  private getNumberOfChannels = (descriptions: string[]): number => {
    // Get the number of extra channels in the uploaded tiff image
    let channels = 1;
    if (descriptions !== undefined && descriptions.length === 1) {
      const description = descriptions[0];

      if (description !== undefined && description.includes("channels=")) {
        // Image-J extension:
        // Image-J stores various parameters in the image description.
        // As such, it stores the number of channels inside the description and
        // store each individual channel in a separate IFD.

        const descChannelsIdx = description.indexOf("channels=") + 9;
        const descChannelsEnd = description.indexOf("\n", descChannelsIdx);
        channels = parseInt(
          description.slice(descChannelsIdx, descChannelsEnd),
          10
        );
      }
    }
    // TODO: check if we need this..
    if (channels === 0) {
      channels = 1;
    }
    return channels;
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
