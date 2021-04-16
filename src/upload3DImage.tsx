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

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    ifds.forEach((ifd, i) => {
      // extract image data from the idf page:
      const sliceChannelRGBA8 = new Uint8ClampedArray(UTIF.toRGBA8(ifds[i]));
      const imageData = new ImageData(sliceChannelRGBA8, width, height);

      // colour the image according to which channel it's from and how many channels there are

      canvas.width = imageData.width;
      canvas.height = imageData.height;
      context.putImageData(imageData, 0, 0);

      let colour;
      let channel = channels - 1 - (i % channels); // channels are ordered backwards in ifds
      if (channels > 1) {
        if (channel === 0) colour = "#FF0000FF";
        else if (channel === 1 && channels !== 2) colour = "#00FF00FF";
        else if (channel === 2) colour = "#0000FFFF";
        else if (channel === 3) colour = "#FFFF00FF";
        else if (channel === 4) colour = "#FF00FFFF";
        else if (channel === 5 || (channel === 1 && channels === 2))
          colour = "#00FFFFFF";

        context.fillStyle = colour;
        context.globalCompositeOperation = "multiply";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (i % channels === 0) {
        slicesDataPromises.push(new Array<Promise<ImageBitmap>>());
      }

      slicesDataPromises[Math.floor(i / channels)][
        i % channels
      ] = createImageBitmap(canvas);
    });

    // the linter complains if we await the createImageBitmaps inside a for loop, so instead we have to let the for loop
    // build a Promise<ImageBitmap>[][], and then use Promise.all twice to turn that into ImageBitmap[][]
    // (this should make it faster, not slower)
    // see https://eslint.org/docs/rules/no-await-in-loop
    // also https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
    const halfUnwrapped: Promise<
      ImageBitmap[]
    >[] = slicesDataPromises.map(async (sliceChannels) =>
      Promise.all(sliceChannels)
    );
    this.slicesData = await Promise.all(halfUnwrapped); // ImageBitmap[][]

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
