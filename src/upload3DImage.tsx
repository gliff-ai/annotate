import React, { Component, ReactNode } from "react";
import Button from "@material-ui/core/Button";
import BackupIcon from "@material-ui/icons/Backup";
import * as UTIF from "utif";
import ImageFileInfo from "./ImageFileInfo";

interface Props {
  setUploadedImage: (
    imageFileInfo: ImageFileInfo,
    slicesData?: Array<Array<ImageBitmap>>
  ) => void;
}

export default class Upload3DImage extends Component<Props> {
  private imageFileInfo: ImageFileInfo | null;

  private slicesData: Array<Array<ImageBitmap>>;

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
    ifds.forEach((ifd) => UTIF.decodeImage(buffer, ifd));

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

    this.slicesData = [];
    const slicesDataPromises: Promise<ImageBitmap>[][] = [];

    ifds.forEach((ifd, i) => {
      if (i % channels === 0) {
        slicesDataPromises.push(new Array<Promise<ImageBitmap>>());
      }

      const sliceChannelRGBA8 = UTIF.toRGBA8(ifds[i]);

      let sliceChannel = new Uint8ClampedArray(width * height * 4);
      const channelIndex = channels - 1 - (i % channels); // channels are ordered backwards in ifds

      if (channels === 1) {
        sliceChannel = Uint8ClampedArray.from(sliceChannelRGBA8);
      } else {
        for (let j = 0; j < width * height; j += 1) {
          if (channelIndex < 3) {
            // channel 1-3: r,g,b
            sliceChannel[4 * j + channelIndex] = sliceChannelRGBA8[4 * j];
          } else if (channelIndex === 4) {
            // channel 5: r+g or yellow
            sliceChannel[4 * j + 0] = sliceChannelRGBA8[4 * j];
            sliceChannel[4 * j + 1] = sliceChannelRGBA8[4 * j];
          } else if (channelIndex === 5) {
            // channel 5: r+b or magenta
            sliceChannel[4 * j + 0] = sliceChannelRGBA8[4 * j];
            sliceChannel[4 * j + 2] = sliceChannelRGBA8[4 * j];
          } else if (channelIndex === 6) {
            // channel 6: g+b or cyan
            sliceChannel[4 * j + 1] = sliceChannelRGBA8[4 * j];
            sliceChannel[4 * j + 2] = sliceChannelRGBA8[4 * j];
          }
          // set alpha to 255
          sliceChannel[4 * j + 3] = 255;
        }
      }

      slicesDataPromises[Math.floor(i / channels)][
        channelIndex
      ] = createImageBitmap(
        //new ImageData(Uint8ClampedArray.from(sliceChannelRGBA8), width, height)
        new ImageData(sliceChannel, width, height)
      );
    });

    this.imageFileInfo.width = width;
    this.imageFileInfo.height = height;

    // the linter complains if we await the createImageBitmaps inside a for loop, so instead we have to let the foo loop
    // build a Promise<ImageBitmap>[][], and then use Promise.all twice to turn that into ImageBitmap[][]
    // see https://eslint.org/docs/rules/no-await-in-loop
    // also https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
    const halfUnwrapped: Promise<
      ImageBitmap[]
    >[] = slicesDataPromises.map(async (sliceChannels) =>
      Promise.all(sliceChannels)
    );
    this.slicesData = await Promise.all(halfUnwrapped); // ImageBitmap[][]

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
