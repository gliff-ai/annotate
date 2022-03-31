import { ImageFileInfo } from "@gliff-ai/upload";

type UploadData = {
  slicesData: Array<Array<ImageBitmap>>;
  imageFileInfo: ImageFileInfo;
};

const logger = console;

const loadImage = (filename: string): Promise<UploadData> =>
  new Promise((resolve: (data: UploadData) => void) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      createImageBitmap(image)
        .then((imageBitmap) => {
          const slicesData: Array<Array<ImageBitmap>> = [[imageBitmap]];
          const imageFileInfo: ImageFileInfo = {
            fileName: filename,
            size: image.width * image.height,
            width: image.width,
            height: image.height,
            num_slices: 1,
            num_channels: 1,
            fileID: "",
            resolution_x: 0,
            resolution_y: 0,
            resolution_z: 0,
            content_hash: "",
          };
          resolve({ slicesData, imageFileInfo });
        })
        .catch((e) => {
          logger.error(e);
        });
    };

    image.src = filename;
  });

export default loadImage;
