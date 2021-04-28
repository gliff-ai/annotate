const loadImage = (filename: string): Promise<Array<Array<ImageBitmap>>> =>
  new Promise((resolve: (slicesData: Array<Array<ImageBitmap>>) => void) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      createImageBitmap(image)
        .then((imageBitmap) => {
          const slicesData: Array<Array<ImageBitmap>> = [[imageBitmap]];
          resolve(slicesData);
        })
        .catch((e) => {
          console.log(e);
        });
    };
    image.src = filename;
  });
export default loadImage;
