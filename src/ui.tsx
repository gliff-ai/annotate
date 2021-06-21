import React, { Component, ChangeEvent, ReactNode } from "react";
import {
  AppBar,
  Container,
  Toolbar,
  Tooltip,
  Button,
  ButtonGroup,
  Grid,
  Typography,
  CssBaseline,
  Slider,
  withStyles,
  Theme,
  Avatar,
  Box,
  IconButton,
  Popover,
  Card,
  Paper,
  Slide,
  WithStyles,
} from "@material-ui/core";

import SVG from "react-inlinesvg";

import { UploadImage, ImageFileInfo } from "@gliff-ai/upload";
import { Annotations } from "@/annotation";
import { PositionAndSize } from "@/annotation/interfaces";
import { ThemeProvider, theme } from "@/theme";
import { MinimapCanvas } from "@/baseCanvas";
import { BackgroundCanvas, BackgroundUI } from "@/toolboxes/background";
import { SplineCanvas, SplineUI } from "@/toolboxes/spline";
import { PaintbrushCanvas, PaintbrushUI } from "@/toolboxes/paintbrush";
import { Labels } from "@/components/Labels";
import { Download } from "@/download/UI";
import { keydownListener } from "@/keybindings";
import { Tools, Tool } from "@/tools";
import { toolTips, minimapToolTips, annotationToolTips } from "./tooltips";

const CONFIG = {
  PAN_AMOUNT: 20,
} as const;

export enum Mode {
  draw,
  select,
}

interface Event extends CustomEvent {
  type: typeof events[number];
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
export const events = [
  "nextAnnotation",
  "previousAnnotation",
  "toggleMode",
  "addAnnotation",
  "clearActiveAnnotation",
  "incrementScale",
  "decrementScale",
  "handleDrawerOpen",
  "handleDrawerClose",
  "resetScaleAndPan",
] as const;

interface State {
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  };
  activeTool?: Tool;
  displayedImage?: ImageBitmap;
  activeAnnotationID: number;
  viewportPositionAndSize: Required<PositionAndSize>;
  minimapPositionAndSize: Required<PositionAndSize>;
  redraw: number;
  sliceIndex: number;
  channels: boolean[];
  popover: boolean;
  anchorElement: HTMLButtonElement | null; // A HTML element. It's used to set the position of the popover menu https://material-ui.com/api/menu/#props
  buttonClicked: string;
  toggleMinimap: boolean;
  mode: Mode;
}

interface Props extends WithStyles<typeof styles> {
  slicesData?: Array<Array<ImageBitmap>>;
  imageFileInfo?: ImageFileInfo;
  annotationsObject?: Annotations;
  presetLabels?: string[];
  saveAnnotationsCallback?: (annotationsObject: Annotations) => void;
  showAppBar: boolean;
}

const styles = {
  annotationToolbar: {
    left: "18px",
    top: "80px",
    marginTop: "30px",
    zIndex: 100,
  },

  mainToolbar: {
    left: "18px",
    bottom: "0",
    marginBottom: "30px",
    zIndex: 100,
  },

  uploadToolbar: {
    right: "18px",
    top: "80px",
    marginTop: "30px",
    zIndex: 100,
    width: "80px",
  },

  mainbox: {
    display: "flex",
    alignItems: "center",
    justifyItems: "space-between",
  },
  popoverAvatar: {
    backgroundColor: theme.palette.primary.main,
    color: "#2B2F3A",
    width: "30px",
    height: "30px",
  },
  iconbutton: {
    marginBottom: "5px",
    marginTop: "7px",
  },
  imageGrid: {
    justify: "flex-start",
    marginTop: "20px",
  },
  mainGrid: {
    height: "calc(100% - 64px)",
  },
  appbar: {
    backgroundColor: "#fafafa",
    height: "90px",
    paddingTop: "9px",
  },
  canvasGrid: {
    width: "100%",
    backgroundColor: "#fafafa",
  },
  imageSliceSlider: {
    width: "70%",
    margin: "auto",
    marginTop: "10px",
  },
  annotationCard: {
    width: "271px",
    height: "375px",
  },
  annotationPaper: {
    padding: "10px",
    backgroundColor: theme.palette.primary.main,
    width: "271px",
  },
  annotationTypography: {
    display: "inline",
    fontSize: "21px",
    marginRight: "125px",
  },
  annotationAvatar: {
    backgroundColor: theme.palette.primary.main,
    display: "inline",
  },
  minimap: {
    right: "250px",
    bottom: "0",
    marginTop: "30px",
    zIndex: 100,
  },
  minimapCard: {
    width: "344px",
    height: "255px",
    paddingTop: "7px",
    left: "250px",
    borderRadius: "10px 0 0 0",
    marginTop: "70px",
  },
  mimimapToggle: {
    width: "61px",
    height: "53px",
    left: "540px",
    borderRadius: "10px 0 0 0",
    padding: "7px 0",
  },
  mimimapToggleAvatar: {
    backgroundColor: theme.palette.primary.main,
    color: "#2B2F3A",
  },
  spaceBetweenAvatar: {
    marginLeft: "3px",
  },
  avatarFontSize: {
    fontSize: "11px",
    fontWeight: 600,
  },
  miniMapToolTipAvatar: {
    backgroundColor: theme.palette.primary.main,
    color: "#2B2F3A",
    width: "40px",
    height: "40px",
  },
  svgLarge: { width: "55%", height: "auto" },
  svgSmall: { width: "18px", height: "auto" },
};

const HtmlTooltip = withStyles((t: Theme) => ({
  tooltip: {
    backgroundColor: "#FFFFFF",
    fontSize: t.typography.pxToRem(12),
    border: "1px solid #dadde9",
    color: "#2B2F3A",
  },
}))(Tooltip);

class UserInterface extends Component<Props, State> {
  static defaultProps = {
    showAppBar: false,
  } as Pick<Props, "showAppBar">;

  annotationsObject: Annotations;

  private presetLabels: string[];

  private slicesData: Array<Array<ImageBitmap>>;

  private imageFileInfo: ImageFileInfo | null;

  private canvasContainer: HTMLDivElement;

  constructor(props: Props) {
    super(props);
    this.annotationsObject = this.props.annotationsObject || new Annotations();
    this.slicesData = this.props.slicesData || null;

    this.state = {
      scaleAndPan: {
        scale: 1,
        x: 0,
        y: 0,
      },
      activeAnnotationID: 0,
      viewportPositionAndSize: { top: 0, left: 0, width: 768, height: 768 },
      minimapPositionAndSize: { top: 0, left: 0, width: 200, height: 200 },
      sliceIndex: 0,
      channels: [true],
      displayedImage: this.slicesData ? this.slicesData[0][0] : null,
      redraw: 0,
      popover: null,
      anchorElement: null,
      buttonClicked: null,
      toggleMinimap: false,
      activeTool: Tools.paintbrush,
      mode: Mode.draw,
    };

    this.annotationsObject.addAnnotation(this.state.activeTool);
    this.presetLabels = this.props.presetLabels || [];
    this.imageFileInfo = this.props.imageFileInfo || null;
  }

  componentDidMount = (): void => {
    document.addEventListener("keydown", keydownListener);

    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
    this.mixChannels();

    const { clientHeight: height, clientWidth: width } = this.canvasContainer;
    this.setViewportPositionAndSize({ top: 0, left: 0, width, height });
  };

  componentDidUpdate = (prevProps: Props): void => {
    if (
      this.props.slicesData &&
      prevProps.slicesData !== this.props.slicesData
    ) {
      this.slicesData = this.props.slicesData;
      /* eslint-disable react/no-did-update-set-state */
      this.setState({
        displayedImage: this.slicesData[0][0],
        sliceIndex: 0,
      });
      this.imageFileInfo = this.props.imageFileInfo;
    }

    if (
      this.props.annotationsObject &&
      prevProps.annotationsObject !== this.props.annotationsObject
    ) {
      this.annotationsObject = this.props.annotationsObject;
      // Restore activeAnnotationID
      this.annotationsObject.setActiveAnnotationID(
        this.state.activeAnnotationID
      );
      this.callRedraw();
    }
  };

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handleEvent = (event: Event): void => {
    if (event.detail === "ui") {
      this[event.type]?.call(this);
    }
  };

  updatePresetLabels = (label: string): void => {
    if (!this.state.displayedImage) return;
    function onlyUnique(value: string, index: number, self: string[]) {
      return self.indexOf(value) === index;
    }
    this.presetLabels.push(label);
    this.presetLabels = this.presetLabels.filter(onlyUnique);
  };

  setViewportPositionAndSize = (
    newViewportPositionAndSize: PositionAndSize
  ): void => {
    this.setState((prevState: State) => {
      const { viewportPositionAndSize } = prevState;
      return {
        viewportPositionAndSize: {
          top: newViewportPositionAndSize.top || viewportPositionAndSize.top,
          left: newViewportPositionAndSize.left || viewportPositionAndSize.left,
          width:
            newViewportPositionAndSize.width || viewportPositionAndSize.width,
          height:
            newViewportPositionAndSize.height || viewportPositionAndSize.height,
        },
      };
    });
  };

  setMinimapPositionAndSize = (
    newMinimapPositionAndSize: PositionAndSize
  ): void => {
    this.setState((prevState: State) => {
      const { minimapPositionAndSize } = prevState;
      return {
        minimapPositionAndSize: {
          top: newMinimapPositionAndSize.top || minimapPositionAndSize.top,
          left: newMinimapPositionAndSize.left || minimapPositionAndSize.left,
          width:
            newMinimapPositionAndSize.width || minimapPositionAndSize.width,
          height:
            newMinimapPositionAndSize.height || minimapPositionAndSize.height,
        },
      };
    });
  };

  setScaleAndPan = (newScaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }): void => {
    this.setState((prevState: State) => {
      const { scaleAndPan } = prevState;
      return {
        scaleAndPan: {
          x: newScaleAndPan.x || scaleAndPan.x,
          y: newScaleAndPan.y || scaleAndPan.y,
          scale: newScaleAndPan.scale || scaleAndPan.scale,
        },
      };
    }, this.limitPan); // this sets limitPan as a callback after state update, ensuring it will use the new scaleAndPan
  };

  incrementScaleAndPan = (key: "x" | "y" | "scale", increment: number): void =>
    this.setState((prevState: State) => {
      const { scaleAndPan } = prevState;
      scaleAndPan[key] += increment;
      return { scaleAndPan };
    }, this.limitPan);

  multiplyScaleAndPan = (key: "x" | "y" | "scale", multiple: number): void =>
    this.setState((prevState: State) => {
      const { scaleAndPan } = prevState;
      scaleAndPan[key] *= multiple;
      return { scaleAndPan };
    }, this.limitPan);

  limitPan = (): void => {
    // adjust pan such that image borders are not inside the canvas

    // calculate how much bigger the image is than the canvas, in canvas space:
    if (!this.state.displayedImage) return;
    const imageScalingFactor = Math.min(
      this.state.viewportPositionAndSize.width /
        this.state.displayedImage.width,
      this.state.viewportPositionAndSize.height /
        this.state.displayedImage.height
    );

    const xMargin =
      this.state.displayedImage.width *
        imageScalingFactor *
        this.state.scaleAndPan.scale -
      this.state.viewportPositionAndSize.width;

    const yMargin =
      this.state.displayedImage.height *
        imageScalingFactor *
        this.state.scaleAndPan.scale -
      this.state.viewportPositionAndSize.height;

    // now calculate the allowable pan range:
    const panRangeX = Math.max(0, xMargin / 2); // scaleAndPan.x can be +-panRangeX
    const panRangeY = Math.max(0, yMargin / 2); // scaleAndPan.y can be +-panRangeY

    // move pan into the allowable range:
    let panX = this.state.scaleAndPan.x;
    let panY = this.state.scaleAndPan.y;
    panX = Math.min(panRangeX, Math.abs(panX)) * Math.sign(panX);
    panY = Math.min(panRangeY, Math.abs(panY)) * Math.sign(panY);

    this.setState((prevState: State) => ({
      scaleAndPan: { x: panX, y: panY, scale: prevState.scaleAndPan.scale },
    }));
  };

  resetScaleAndPan = (): void => {
    this.setScaleAndPan({ scale: 1, x: 0, y: 0 });
  };

  incrementScale = (): void => {
    const panMultiplier =
      (1 + this.state.scaleAndPan.scale) / this.state.scaleAndPan.scale;

    this.multiplyScaleAndPan("x", panMultiplier);
    this.multiplyScaleAndPan("y", panMultiplier);
    this.incrementScaleAndPan("scale", 1);
  };

  decrementScale = (): void => {
    // Zoom out only if zoomed in.
    if (this.state.scaleAndPan.scale > 1) {
      const panMultiplier =
        (this.state.scaleAndPan.scale - 1) / this.state.scaleAndPan.scale;

      this.multiplyScaleAndPan("x", panMultiplier);
      this.multiplyScaleAndPan("y", panMultiplier);
      this.incrementScaleAndPan("scale", -1);
    }
  };

  incrementPanX = (): void => {
    // negative is left, +ve is right...
    this.incrementScaleAndPan("x", CONFIG.PAN_AMOUNT);
  };

  decrementPanX = (): void => {
    // negative is left, +ve is right...
    this.incrementScaleAndPan("x", -CONFIG.PAN_AMOUNT);
  };

  incrementPanY = (): void => {
    // negative is up, +ve is down...
    this.incrementScaleAndPan("y", CONFIG.PAN_AMOUNT);
  };

  decrementPanY = (): void => {
    // negative is up, +ve is down...
    this.incrementScaleAndPan("y", -CONFIG.PAN_AMOUNT);
  };

  setUploadedImage = (
    imageFileInfo: ImageFileInfo,
    slicesData: Array<Array<ImageBitmap>>
  ): void => {
    this.imageFileInfo = imageFileInfo;
    this.slicesData = slicesData;
    this.setState(
      {
        sliceIndex: 0,
        channels: Array(slicesData[0].length).fill(true) as boolean[],
      },
      this.mixChannels
    );

    // If annotationsObject is not passed down as props, create a new annotationsObject.
    // Otherwise the props for annotationsObject will update after the uplaoed image has been stored.
    if (!this.props.annotationsObject) {
      this.annotationsObject = new Annotations();
      this.annotationsObject.addAnnotation(this.state.activeTool);
    }

    // TODO: Add saveImageCallback to store uplaoded image in dominate
  };

  mixChannels = (): void => {
    // combines the separate channels in this.slicesData[this.state.sliceIndex] into
    // a single ImageBitmap according to the user's channel picker settings, and stores
    // the result in this.state.displayedImage

    // draw the channels onto a new canvas using additive composition:
    if (!this.slicesData) return;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = this.slicesData[this.state.sliceIndex][0].width;
    canvas.height = this.slicesData[this.state.sliceIndex][0].height;
    context.globalCompositeOperation = "lighter";
    this.slicesData[this.state.sliceIndex].forEach(
      (channel: ImageBitmap, i: number) => {
        if (this.state.channels[i]) {
          context.drawImage(channel, 0, 0);
        }
      }
    );

    createImageBitmap(canvas)
      .then((displayedImage) => this.setState({ displayedImage }))
      .catch((e) => console.log(e));
  };

  activateTool = (tool: Tool): void => {
    this.setState({ activeTool: tool, mode: Mode.draw }, () => {
      this.reuseEmptyAnnotation();
    });
  };

  addAnnotation = (): void => {
    if (!this.state.displayedImage) return;
    this.annotationsObject.addAnnotation(this.state.activeTool);
    this.annotationsObject.setSplineSpaceTimeInfo(this.state.sliceIndex);
    this.setState({
      activeAnnotationID: this.annotationsObject.getActiveAnnotationID(),
    });
  };

  nextAnnotation = (): void => {
    this.cycleActiveAnnotation(true);
  };

  previousAnnotation = (): void => {
    this.cycleActiveAnnotation(false);
  };

  toggleMode = (): void => {
    if (this.state.mode === Mode.draw) {
      this.setState({ mode: Mode.select, buttonClicked: "Select" });
    } else {
      for (const tool of toolTips) {
        console.log(tool?.tool);
        if (tool?.tool === this.state.activeTool) {
          this.setState({ mode: Mode.draw, buttonClicked: tool.name });
          break;
        }
      }
    }
  };

  cycleActiveAnnotation = (forward = true): void => {
    const data = this.annotationsObject.getAllAnnotations();
    this.setState((prevState) => {
      let i = prevState.activeAnnotationID;
      const inc = forward ? 1 : -1;

      // cycle i forward or backward until we reach another annotation whose toolbox attribute matches the current activeTool:
      do {
        // increment or decrement i by 1, wrapping around if we go above the length of the array(-1) or below 0:
        i =
          (i + inc + this.annotationsObject.length()) %
          this.annotationsObject.length();
      } while (data[i].toolbox !== Tools[prevState.activeTool]);

      this.annotationsObject.setActiveAnnotationID(i);
      return { activeAnnotationID: i };
    });
  };

  reuseEmptyAnnotation = (): void => {
    /* If the active annotation object is empty, change the value of toolbox
    to match the active tool. */
    const toolbox =
      this.state.activeTool === "eraser" ? "paintbrush" : this.state.activeTool;
    if (this.annotationsObject.isActiveAnnotationEmpty()) {
      this.annotationsObject.setActiveAnnotationToolbox(toolbox);
      this.annotationsObject.setSplineSpaceTimeInfo(this.state.sliceIndex);
    }
  };

  clearActiveAnnotation = (): void => {
    this.annotationsObject.deleteActiveAnnotation();
    if (this.annotationsObject.length() === 1) {
      // if we delete the last annotation, annotationsObject will make a new one with the paintbrush toolbox
      // (since it doesn't know which tool is active), so we set the toolbox correctly here:
      this.annotationsObject.setActiveAnnotationToolbox(this.state.activeTool);
    }
    this.callRedraw();
  };

  callRedraw = () => {
    this.setState((prevState) => ({
      redraw: prevState.redraw + 1,
    }));
  };

  changeSlice = (e: ChangeEvent, value: number): void => {
    this.setState(
      {
        sliceIndex: value,
      },
      () => {
        this.reuseEmptyAnnotation();
        this.mixChannels();
      }
    );
  };

  toggleChannelAtIndex = (index: number): void => {
    this.setState((prevState: State) => {
      const { channels } = prevState;
      channels[index] = !channels[index];
      return { channels };
    }, this.mixChannels);
  };

  handleClose = (event: React.MouseEvent) => {
    this.setState({ anchorElement: null, popover: null });
  };

  handleRequestClose = () => {
    this.setState({
      popover: false,
    });
  };

  handleDrawerOpen = () => {
    this.setState({
      toggleMinimap: true,
    });
  };

  handleDrawerClose = () => {
    this.setState({
      toggleMinimap: false,
    });
  };

  render = (): ReactNode => {
    const { classes, showAppBar, saveAnnotationsCallback } = this.props;

    const uploadDownload = (
      <>
        <Grid item>
          <UploadImage
            setUploadedImage={this.setUploadedImage}
            spanElement={
              /* eslint-disable react/jsx-wrap-multilines */
              <Button aria-label="upload-picture" component="span">
                <img
                  src={require("./assets/upload-icon.svg") as string}
                  alt="Upload Icon"
                />
              </Button>
            }
            multiple={false}
          />
        </Grid>

        <Grid item>
          <Download
            annotations={this.annotationsObject.getAllAnnotations()}
            imageFileInfo={this.imageFileInfo}
          />
          {saveAnnotationsCallback && (
            <Button
              aria-label="save"
              onClick={() => saveAnnotationsCallback(this.annotationsObject)}
            />
          )}
        </Grid>
      </>
    );

    const appBar = !showAppBar ? (
      <div
        className={`${classes.uploadToolbar} MuiButtonGroup-root`}
        style={{ position: "fixed" }}
      >
        <Grid container direction="row">
          {uploadDownload}
        </Grid>
      </div>
    ) : (
      <AppBar position="fixed" className={classes.appbar}>
        <Toolbar>
          <Grid container direction="row">
            <Grid item className={classes.iconbutton}>
              <img
                src={require(`./assets/gliff-master-black.svg`) as string}
                width="79px"
                height="60px"
                alt="gliff logo"
              />
            </Grid>
          </Grid>

          {uploadDownload}
        </Toolbar>
      </AppBar>
    );

    return (
      <ThemeProvider theme={theme}>
        <div
          className={classes.annotationToolbar}
          style={{ position: "fixed" }}
        >
          <Grid container direction="row">
            <ButtonGroup size="small">
              {annotationToolTips.map((toolTip) => (
                <HtmlTooltip
                  key={toolTip.name}
                  title={
                    <Box className={classes.mainbox}>
                      <Box mr={3} ml={2}>
                        <Typography>{toolTip.name}</Typography>
                      </Box>

                      <Avatar className={classes.popoverAvatar}>
                        {toolTip.shortcutSymbol}
                      </Avatar>
                    </Box>
                  }
                  placement="right"
                >
                  <IconButton
                    size="small"
                    className={classes.iconbutton}
                    onClick={(e: React.MouseEvent) =>
                      this.setState(
                        {
                          buttonClicked: toolTip.name,
                        },
                        () => {
                          if (
                            this.state.buttonClicked === "Add New Annotation"
                          ) {
                            this.addAnnotation();
                          }
                          if (this.state.buttonClicked === "Clear Annotation") {
                            this.clearActiveAnnotation();
                          }
                        }
                      )
                    }
                  >
                    <Avatar sizes="large">
                      <SVG
                        src={`${toolTip.icon}`}
                        className={classes.svgLarge}
                        fill={
                          this.state.buttonClicked === toolTip.name
                            ? theme.palette.primary.main
                            : null
                        }
                      />
                    </Avatar>
                  </IconButton>
                </HtmlTooltip>
              ))}
            </ButtonGroup>
          </Grid>
        </div>

        <div
          className={classes.mainToolbar}
          style={{
            position: "fixed",
          }}
        >
          <Grid container direction="row">
            <ButtonGroup>
              {toolTips.map((toolTip) => (
                <HtmlTooltip
                  key={toolTip.name}
                  title={
                    <Box className={classes.mainbox}>
                      <Box mr={3} ml={2}>
                        <Typography>{toolTip.name}</Typography>
                      </Box>
                      <Avatar className={classes.popoverAvatar}>
                        {toolTip.shortcut}
                      </Avatar>
                    </Box>
                  }
                  placement="right"
                >
                  <IconButton
                    size="small"
                    className={classes.iconbutton}
                    onClick={(e: React.MouseEvent) =>
                      this.setState(
                        {
                          popover: true,
                          buttonClicked: toolTip.name,
                          anchorElement: e.currentTarget as HTMLButtonElement,
                        },
                        () => {
                          if (this.state.buttonClicked === "Eraser") {
                            this.activateTool("eraser");
                          }
                          if (this.state.buttonClicked === "Brush") {
                            this.activateTool("paintbrush");
                          }
                          if (this.state.buttonClicked === "Magic Spline") {
                            this.activateTool("magicspline");
                          }
                          if (this.state.buttonClicked === "Spline") {
                            this.activateTool("spline");
                          }
                          if (this.state.buttonClicked === "Select") {
                            this.toggleMode();
                          }
                        }
                      )
                    }
                  >
                    <Avatar sizes="large" variant="circular">
                      <SVG
                        src={`${toolTip.icon}`}
                        className={classes.svgLarge}
                        fill={
                          this.state.buttonClicked === toolTip.name
                            ? theme.palette.primary.main
                            : null
                        }
                      />
                    </Avatar>
                  </IconButton>
                </HtmlTooltip>
              ))}
            </ButtonGroup>
          </Grid>
        </div>

        <CssBaseline />

        <Container disableGutters>
          {appBar}
          <Grid
            container
            spacing={0}
            justify="center"
            wrap="nowrap"
            className={classes.mainGrid}
          >
            <Grid
              item
              className={classes.canvasGrid}
              style={{ position: "relative" }}
              ref={(container) => {
                if (container) {
                  this.canvasContainer = container;
                }
              }}
            >
              {this.state.displayedImage && (
                <>
                  <BackgroundCanvas
                    scaleAndPan={this.state.scaleAndPan}
                    displayedImage={this.state.displayedImage}
                    canvasPositionAndSize={this.state.viewportPositionAndSize}
                    setCanvasPositionAndSize={this.setViewportPositionAndSize}
                  />

                  <SplineCanvas
                    scaleAndPan={this.state.scaleAndPan}
                    activeTool={this.state.activeTool}
                    mode={this.state.mode}
                    annotationsObject={this.annotationsObject}
                    displayedImage={this.state.displayedImage}
                    canvasPositionAndSize={this.state.viewportPositionAndSize}
                    setCanvasPositionAndSize={this.setViewportPositionAndSize}
                    redraw={this.state.redraw}
                    sliceIndex={this.state.sliceIndex}
                    setUIActiveAnnotationID={(id) => {
                      this.setState({ activeAnnotationID: id });
                    }}
                    setActiveTool={(tool: Tool) => {
                      this.setState({ activeTool: tool });
                    }}
                  />
                  <PaintbrushCanvas
                    scaleAndPan={this.state.scaleAndPan}
                    activeTool={this.state.activeTool}
                    mode={this.state.mode}
                    annotationsObject={this.annotationsObject}
                    displayedImage={this.state.displayedImage}
                    canvasPositionAndSize={this.state.viewportPositionAndSize}
                    setCanvasPositionAndSize={this.setViewportPositionAndSize}
                    redraw={this.state.redraw}
                    sliceIndex={this.state.sliceIndex}
                    setUIActiveAnnotationID={(id) => {
                      this.setState({ activeAnnotationID: id });
                    }}
                    setActiveTool={(tool: Tool) => {
                      this.setState({ activeTool: tool });
                    }}
                  />
                </>
              )}

              {this.slicesData && this.slicesData.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: `${
                      this.state.viewportPositionAndSize.top +
                      this.state.viewportPositionAndSize.height +
                      5
                    }px`,
                    left: `${this.state.viewportPositionAndSize.left}px`,
                    width: `${this.state.viewportPositionAndSize.width}px`,
                  }}
                >
                  <div className={classes.imageSliceSlider}>
                    <Slider
                      value={this.state.sliceIndex}
                      onChange={this.changeSlice}
                      aria-labelledby="slice-index-slider"
                      step={1}
                      min={0}
                      max={this.slicesData.length - 1}
                      valueLabelDisplay="auto"
                    />
                  </div>
                </div>
              )}
            </Grid>

            <Popover
              open={
                this.state.buttonClicked === "Annonation Label" &&
                this.state.popover
              }
              anchorEl={this.state.anchorElement}
              onClose={this.handleClose}
            >
              <Card className={classes.annotationCard}>
                <Paper
                  elevation={0}
                  variant="outlined"
                  square
                  className={classes.annotationPaper}
                >
                  <Typography className={classes.annotationTypography}>
                    Annotation
                  </Typography>
                  <Avatar className={classes.annotationAvatar}>
                    <SVG
                      src={require("./assets/pin-icon.svg") as string}
                      className={classes.svgSmall}
                    />
                  </Avatar>
                </Paper>
                <Paper elevation={0} square>
                  <Grid container justify="center">
                    <Labels
                      annotationObject={this.annotationsObject}
                      presetLabels={this.presetLabels}
                      updatePresetLabels={this.updatePresetLabels}
                      activeAnnotationID={this.state.activeAnnotationID}
                    />
                  </Grid>
                </Paper>
              </Card>
            </Popover>
            <BackgroundUI
              open={
                (this.state.buttonClicked === "Contrast" &&
                  this.state.popover) ||
                (this.state.buttonClicked === "Brightness" &&
                  this.state.popover) ||
                (this.state.buttonClicked === "Channel" && this.state.popover)
              }
              buttonClicked={this.state.buttonClicked}
              anchorElement={this.state.anchorElement}
              onClose={this.handleClose}
              channels={this.state.channels}
              toggleChannelAtIndex={this.toggleChannelAtIndex}
            />
            <PaintbrushUI
              isOpen={
                this.state.buttonClicked === "Brush" && this.state.popover
              }
              anchorElement={this.state.anchorElement}
              onClose={this.handleClose}
              onClick={this.handleRequestClose}
            />
            <SplineUI
              isOpen={
                this.state.buttonClicked === "Spline" && this.state.popover
              }
              anchorElement={this.state.anchorElement}
              onClick={this.handleRequestClose}
              onClose={this.handleClose}
              activeTool={this.state.activeTool}
              activateTool={this.activateTool}
            />
          </Grid>
        </Container>
        <div
          className={classes.minimap}
          style={{
            position: "fixed",
          }}
        >
          <Slide in={this.state.toggleMinimap} direction="up" timeout={1000}>
            <Card
              className={classes.minimapCard}
              style={{
                position: "relative",
              }}
            >
              {minimapToolTips.map((minimapToolTip) => (
                <HtmlTooltip
                  key={minimapToolTip.name}
                  title={
                    <Box className={classes.mainbox}>
                      <Box mr={3} ml={2}>
                        <Typography color="inherit">
                          {minimapToolTip.name}
                        </Typography>
                      </Box>
                      <Avatar className={classes.popoverAvatar}>
                        <Typography className={classes.avatarFontSize}>
                          {minimapToolTip.shortcut}
                        </Typography>
                      </Avatar>
                      <div className={classes.spaceBetweenAvatar}>
                        <Avatar className={classes.popoverAvatar}>
                          <Typography className={classes.avatarFontSize}>
                            {minimapToolTip.shortcutSymbol}
                          </Typography>
                        </Avatar>
                      </div>
                    </Box>
                  }
                  placement="top"
                >
                  <IconButton
                    size="small"
                    style={minimapToolTip.styling}
                    onClick={(e: React.MouseEvent) =>
                      this.setState(
                        {
                          buttonClicked: minimapToolTip.name,
                        },
                        () => {
                          if (minimapToolTip.name === "Zoom In") {
                            this.incrementScale();
                          } else if (minimapToolTip.name === "Zoom Out") {
                            this.decrementScale();
                          } else if (minimapToolTip.name === "Fit to Page") {
                            this.resetScaleAndPan();
                          } else if (minimapToolTip.name === "Minimise Map") {
                            this.handleDrawerClose();
                          }
                        }
                      )
                    }
                  >
                    <Avatar sizes="large">
                      <SVG
                        src={`${minimapToolTip.icon}`}
                        className={classes.svgLarge}
                      />
                    </Avatar>
                  </IconButton>
                </HtmlTooltip>
              ))}
              {/* Background canvas for the minimap */}
              {this.state.displayedImage && (
                <>
                  <BackgroundCanvas
                    scaleAndPan={{ x: 0, y: 0, scale: 1 }}
                    displayedImage={this.state.displayedImage}
                    canvasPositionAndSize={this.state.minimapPositionAndSize}
                    setCanvasPositionAndSize={this.setMinimapPositionAndSize}
                  />
                  <MinimapCanvas
                    displayedImage={this.state.displayedImage}
                    scaleAndPan={this.state.scaleAndPan}
                    setScaleAndPan={this.setScaleAndPan}
                    canvasPositionAndSize={this.state.viewportPositionAndSize}
                    minimapPositionAndSize={this.state.minimapPositionAndSize}
                    setMinimapPositionAndSize={this.setMinimapPositionAndSize}
                  />{" "}
                </>
              )}
            </Card>
          </Slide>

          {this.state.toggleMinimap === false ? (
            <Slide
              in={!this.state.toggleMinimap}
              direction="up"
              timeout={{ enter: 1000 }}
            >
              <Card
                className={classes.mimimapToggle}
                style={{
                  position: "relative",
                  textAlign: "center",
                }}
              >
                <HtmlTooltip
                  key="Maximise Map"
                  title={
                    <Box className={classes.mainbox}>
                      <Box mr={3} ml={2}>
                        <Typography color="inherit">Maximise Map</Typography>
                      </Box>
                      <Avatar className={classes.popoverAvatar}>
                        <Typography className={classes.avatarFontSize}>
                          ALT
                        </Typography>
                      </Avatar>
                      <div className={classes.spaceBetweenAvatar}>
                        <Avatar className={classes.popoverAvatar}>
                          <Typography className={classes.avatarFontSize}>
                            +
                          </Typography>
                        </Avatar>
                      </div>
                    </Box>
                  }
                  placement="top"
                >
                  <IconButton
                    onClick={(e: React.MouseEvent) =>
                      this.setState(
                        {
                          buttonClicked: "Maximise Map",
                        },
                        this.handleDrawerOpen
                      )
                    }
                    edge="start"
                    size="small"
                  >
                    <Avatar>
                      <SVG
                        src={require("./assets/maximise-icon.svg") as string}
                        className={classes.svgLarge}
                      />
                    </Avatar>
                  </IconButton>
                </HtmlTooltip>
              </Card>
            </Slide>
          ) : null}
        </div>
      </ThemeProvider>
    );
  };
}

export default withStyles(styles)(UserInterface);
