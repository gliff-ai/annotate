import React, { Component, ReactNode } from "react";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import PhotoCamera from "@material-ui/icons/PhotoCamera";

interface UploadImage {
  imageFile?: File;
}

interface UploadState {
  imageFile?: File;
}

export default class Upload3DImage extends Component<UploadImage, UploadState> {
  constructor(props: UploadImage) {
    super(props);
    this.state = {
      imageFile: null,
    };
  }

  render = (): ReactNode => {
    return (
      <div>
        <input
          accept="image/*"
          id="icon-button-file"
          type="file"
          style={{ display: "none" }}
          onChange={(e) => {
            console.log(e.target.files[0]);
            this.setState({ imageFile: e.target.files[0] }, () => {
              console.log(this.state.imageFile);
            });
          }}
        />
        <label htmlFor="icon-button-file">
          <IconButton aria-label="upload picture" component="span">
            <PhotoCamera />
          </IconButton>
        </label>
      </div>
    );
  };
}
