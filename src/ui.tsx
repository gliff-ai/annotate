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
} from "@material-ui/core";

import SVG from "react-inlinesvg";

import { ImageFileInfo } from "@gliff-ai/upload/typings";
import { UploadImage } from "@gliff-ai/upload";

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
import { Save } from "@material-ui/icons";

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
  anchorEl: HTMLButtonElement | null;
  buttonClicked: string;
  toggleMinimap: boolean;
  mode: Mode;
}

interface Props {
  slicesData?: Array<Array<ImageBitmap>>;
  imageFileInfo?: ImageFileInfo;
  annotationsObject?: Annotations;
  presetLabels?: string[];
  saveAnnotationsCallback?: (annotationsObject: Annotations) => void;
}

interface ToolTips {
  name: string;
  icon: string;
  shortcut: string;
}

const HtmlTooltip = withStyles((t: Theme) => ({
  tooltip: {
    backgroundColor: "#FFFFFF",
    fontSize: t.typography.pxToRem(12),
    border: "1px solid #dadde9",
    color: "#2B2F3A",
  },
}))(Tooltip);

export class UserInterface extends Component<Props, State> {
  annotationsObject: Annotations;

  private presetLabels: string[];

  private slicesData: Array<Array<ImageBitmap>>;

  private imageFileInfo: ImageFileInfo | null;

  private canvasContainer: HTMLDivElement;

  toolTips: ToolTips[] = [
    {
      name: "Select",
      icon: require(`./assets/select-icon.svg`) as string,
      shortcut: "V",
    },
    {
      name: "Brush",
      icon: require(`./assets/brush-icon.svg`) as string,
      shortcut: "B",
    },
    {
      name: "Eraser",
      icon: require(`./assets/eraser-icon.svg`) as string,
      shortcut: "E",
    },
    {
      name: "Spline",
      icon: require(`./assets/splines-icon.svg`) as string,
      shortcut: "S",
    },
    {
      name: "Magic Spline",
      icon: require(`./assets/magic-spline-icon.svg`) as string,
      shortcut: "M",
    },

    {
      name: "Contrast",
      icon: require(`./assets/contrast-icon.svg`) as string,
      shortcut: `\\`,
    },
    {
      name: "Brightness",
      icon: require(`./assets/brightness-icon.svg`) as string,
      shortcut: `/`,
    },
    {
      name: "Channel",
      icon: require(`./assets/channels-icon.svg`) as string,
      shortcut: `C`,
    },

    {
      name: "Annonation Label",
      icon: require(`./assets/annotation-label-icon.svg`) as string,
      shortcut: "L",
    },
  ];

  minimapToolTips = [
    {
      name: "Minimise Map",
      icon: require(`./assets/minimise-icon.svg`) as string,
      shortcut: "Alt",
      shortcutSymbol: "-",
      styling: { marginRight: "86px", marginLeft: "15px" },
    },

    {
      name: "Zoom In",
      icon: require(`./assets/zoom-in-icon.svg`) as string,
      shortcut: "Ctrl",
      shortcutSymbol: "+",
      styling: { marginRight: "22px" },
    },
    {
      name: "Zoom Out",
      icon: require(`./assets/zoom-out-icon.svg`) as string,
      shortcut: "Ctrl",
      shortcutSymbol: "-",
      styling: { marginRight: "30px" },
    },
    {
      name: "Fit to Page",
      icon: require(`./assets/reset-zoom-and-pan-icon.svg`) as string,
      shortcut: "Ctrl",
      shortcutSymbol: "[",
    },
  ];

  annotationToolTips = [
    {
      name: "Add New Annotation",
      icon: require(`./assets/new-annotation-icon.svg`) as string,
      shortcutSymbol: "+",
    },
    {
      name: "Clear Annotation",
      icon: require(`./assets/delete-annotation-icon.svg`) as string,
      shortcutSymbol: "-",
    },
  ];

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
      anchorEl: null,
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
    console.log("hellp");
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
    this.setState({ activeTool: tool }, () => {
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
      this.setState({ mode: Mode.select });
    } else {
      this.setState({ mode: Mode.draw });
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
    if (this.annotationsObject.isActiveAnnotationEmpty()) {
      this.annotationsObject.setActiveAnnotationToolbox(this.state.activeTool);
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

  // Close popover

  handleClose = (event: React.MouseEvent) => {
    this.setState({ anchorEl: null, popover: null });
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

  render = (): ReactNode => (
    <ThemeProvider theme={theme}>
      <div
        style={{
          position: "fixed",
          left: "18px",
          top: "80px",
          marginTop: "30px",
          zIndex: 100,
        }}
      >
        <Grid container direction="row">
          <ButtonGroup size="small" style={{ background: "#fafafa" }}>
            {this.annotationToolTips.map((toolTip) => (
              <HtmlTooltip
                key={toolTip.name}
                title={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyItems="space-between"
                  >
                    <Box mr={3}>
                      <Typography>{toolTip.name}</Typography>
                    </Box>

                    <Avatar
                      style={{
                        backgroundColor: "#02FFAD",
                        color: "#2B2F3A",
                      }}
                    >
                      {toolTip.shortcutSymbol}
                    </Avatar>
                  </Box>
                }
                placement="right"
              >
                <IconButton
                  size="small"
                  style={{
                    marginBottom: "5px",
                    marginTop: "7px",
                  }}
                  onClick={(e: React.MouseEvent) =>
                    this.setState(
                      {
                        buttonClicked: toolTip.name,
                      },
                      () => {
                        if (this.state.buttonClicked === "Add New Annotation") {
                          this.addAnnotation();
                        }
                        if (this.state.buttonClicked === "Clear Annotation") {
                          this.clearActiveAnnotation();
                        }
                      }
                    )
                  }
                >
                  <Avatar sizes="large" variant="circular">
                    <SVG
                      src={`${toolTip.icon}`}
                      width="55%"
                      height="auto"
                      fill={
                        this.state.buttonClicked === toolTip.name
                          ? "#02FFAD"
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
        style={{
          position: "fixed",
          left: "18px",
          bottom: "0",
          marginBottom: "30px",
          zIndex: 100,
        }}
      >
        <Grid container direction="row">
          <ButtonGroup
            size="small"
            style={{
              margin: "-5px",
              background: "#fafafa",
            }}
          >
            {this.toolTips.map((toolTip) => (
              <HtmlTooltip
                key={toolTip.name}
                title={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyItems="space-between"
                  >
                    <Box mr={3}>
                      <Typography>{toolTip.name}</Typography>
                    </Box>
                    <Avatar
                      variant="circle"
                      style={{
                        backgroundColor: "#02FFAD",
                        color: "#2B2F3A",
                      }}
                    >
                      {toolTip.shortcut}
                    </Avatar>
                  </Box>
                }
                placement="right"
              >
                <IconButton
                  size="small"
                  style={{
                    marginBottom: "5px",
                    marginTop: "7px",
                  }}
                  onClick={(e: React.MouseEvent) =>
                    this.setState(
                      {
                        popover: true,
                        buttonClicked: toolTip.name,
                        anchorEl: e.currentTarget as HTMLButtonElement,
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
                      }
                    )
                  }
                >
                  <Avatar sizes="large" variant="circular">
                    <SVG
                      src={`${toolTip.icon}`}
                      width="55%"
                      height="auto"
                      fill={
                        this.state.buttonClicked === toolTip.name
                          ? "#02FFAD"
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
        <AppBar
          position="static"
          style={{ backgroundColor: "#fafafa", height: "90px" }}
        >
          <Toolbar>
            <Grid container direction="row">
              <Grid item justify="flex-start" style={{ marginTop: "18px" }}>
                <img
                  src={require(`./assets/gliff-master-black.png`) as string}
                  width="79px"
                  height="60px"
                  alt="gliff logo"
                />
              </Grid>

              <Grid>
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

              <Grid>
                <Download
                  annotations={this.annotationsObject.getAllAnnotations()}
                  imageFileInfo={this.imageFileInfo}
                />
                {this.props.saveAnnotationsCallback && (
                  <Button
                    aria-label="save"
                    onClick={() =>
                      this.props.saveAnnotationsCallback(this.annotationsObject)
                    }
                  >
                    <Save />
                  </Button>
                )}
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
        <Grid
          container
          spacing={0}
          justify="center"
          wrap="nowrap"
          style={{ height: "calc(100% - 64px)" }}
        >
          <Grid
            item
            style={{
              width: "100%",
              position: "relative",
              backgroundColor: "#fafafa",
            }}
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
            )}
          </Grid>

          <Popover
            open={
              this.state.buttonClicked === "Annonation Label" &&
              this.state.popover
            }
            anchorEl={this.state.anchorEl}
            onClose={this.handleClose}
          >
            <Card
              style={{
                width: "271px",
                height: "375px",
              }}
            >
              <Paper
                elevation={0}
                variant="outlined"
                square
                style={{
                  padding: "10px",
                  backgroundColor: "#02FFAD",
                  width: "271px",
                }}
              >
                <Typography
                  style={{
                    display: "inline",
                    fontSize: "21px",
                    marginRight: "125px",
                  }}
                >
                  Annotation
                </Typography>
                <Avatar
                  style={{ backgroundColor: "#02FFAD", display: "inline" }}
                >
                  <SVG
                    src={require("./assets/pin-icon.svg") as string}
                    width="18px"
                    height="auto"
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
              (this.state.buttonClicked === "Contrast" && this.state.popover) ||
              (this.state.buttonClicked === "Brightness" &&
                this.state.popover) ||
              (this.state.buttonClicked === "Channel" && this.state.popover)
            }
            buttonClicked={this.state.buttonClicked}
            anchorEl={this.state.anchorEl}
            onClose={this.handleClose}
            channels={this.state.channels}
            toggleChannelAtIndex={this.toggleChannelAtIndex}
          />
          <PaintbrushUI
            open={this.state.buttonClicked === "Brush" && this.state.popover}
            anchorEl={this.state.anchorEl}
            onClose={this.handleClose}
            onClick={this.handleRequestClose}
          />
          <SplineUI
            open={this.state.buttonClicked === "Spline" && this.state.popover}
            anchorEl={this.state.anchorEl}
            onClick={this.handleRequestClose}
            onClose={this.handleClose}
            activeTool={this.state.activeTool}
            activateTool={this.activateTool}
          />
        </Grid>
      </Container>
      <div
        style={{
          position: "fixed",
          right: "250px",
          bottom: "0",
          marginTop: "30px",
          zIndex: 100,
        }}
      >
        <Slide in={this.state.toggleMinimap} direction="up" timeout={1000}>
          <Card
            style={{
              width: "344px",
              height: "248px",
              paddingTop: "7px",
              position: "relative",
              left: "250px",
              borderRadius: "10px 0 0 0",
            }}
          >
            {this.minimapToolTips.map((minimapToolTip) => (
              <HtmlTooltip
                key={minimapToolTip.name}
                title={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyItems="space-between"
                  >
                    <Box mr={3}>
                      <Typography color="inherit">
                        {minimapToolTip.name}
                      </Typography>
                    </Box>
                    <Avatar
                      style={{
                        backgroundColor: "#02FFAD",
                        color: "#2B2F3A",
                      }}
                    >
                      {minimapToolTip.shortcut}
                    </Avatar>
                    <Avatar
                      style={{
                        backgroundColor: "#02FFAD",
                        color: "#2B2F3A",
                      }}
                    >
                      {minimapToolTip.shortcutSymbol}
                    </Avatar>
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
                        }
                        if (minimapToolTip.name === "Zoom Out") {
                          this.decrementScale();
                        }
                        if (minimapToolTip.name === "Fit to Page") {
                          this.resetScaleAndPan();
                        }
                        if (minimapToolTip.name === "Minimise Map") {
                          this.handleDrawerClose();
                        }
                      }
                    )
                  }
                >
                  <Avatar sizes="large">
                    <SVG
                      src={`${minimapToolTip.icon}`}
                      width="55%"
                      height="auto"
                      fill={
                        this.state.buttonClicked === minimapToolTip.name
                          ? "#02FFAD"
                          : null
                      }
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
              style={{
                width: "61px",
                height: "53px",
                left: "540px",
                position: "relative",
                borderRadius: "10px 0 0 0",
                textAlign: "center",
                padding: "7px 0",
              }}
            >
              <HtmlTooltip
                key="Maximise Map"
                title={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyItems="space-between"
                  >
                    <Box mr={3}>
                      <Typography color="inherit">Maximise Map</Typography>
                    </Box>
                    <Avatar
                      style={{
                        backgroundColor: "#02FFAD",
                        color: "#2B2F3A",
                      }}
                    >
                      Alt
                    </Avatar>
                    <Avatar
                      style={{
                        backgroundColor: "#02FFAD",
                        color: "#2B2F3A",
                      }}
                    >
                      +
                    </Avatar>
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
                      width="55%"
                      height="auto"
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
}
