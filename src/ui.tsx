import React, { Component, ChangeEvent, ReactNode } from "react";
import {
  AppBar,
  Container,
  Toolbar,
  Tooltip,
  Button,
  ButtonGroup,
  Grid,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  CssBaseline,
  Slider,
} from "@material-ui/core";

import {
  Add,
  AspectRatio,
  Delete,
  ZoomOut,
  ZoomIn,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardArrowUp,
  ExpandMore,
  Backup,
} from "@material-ui/icons";
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
import { keydownListener } from "@/keybindings";

import { Tools, Tool } from "@/tools";

const CONFIG = {
  PAN_AMOUNT: 20,
} as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
export const events = ["nextAnnotation", "previousAnnotation"] as const;

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
  expanded: string | boolean;
  callRedraw: number;
  sliceIndex: number;
  channels: boolean[];
}

interface Props {
  slicesData?: Array<Array<ImageBitmap>>;
  annotationsObject?: Annotations;
  presetLabels?: string[];
}

export class UserInterface extends Component<Props, State> {
  annotationsObject: Annotations;

  private presetLabels: string[];

  private slicesData: Array<Array<ImageBitmap>>;

  private imageFileInfo: ImageFileInfo | null;

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
      expanded: "labels-toolbox",
      callRedraw: 0,
      sliceIndex: 0,
      channels: [true],
      displayedImage: this.slicesData[0][0] || null,
    };

    this.annotationsObject.addAnnotation(this.state.activeTool);
    this.presetLabels = this.props.presetLabels || [];
    this.imageFileInfo = null;
  }

  componentDidMount = (): void => {
    document.addEventListener("keydown", keydownListener);
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
    this.mixChannels();
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
  };

  mixChannels = (): void => {
    // combines the separate channels in this.slicesData[this.state.sliceIndex] into
    // a single ImageBitmap according to the user's channel picker settings, and stores
    // the result in this.state.displayedImage

    // draw the channels onto a new canvas using additive composition:
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
    this.annotationsObject.addAnnotation(this.state.activeTool);
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
    }
  };

  handleToolboxChange = (panel: string) => (
    event: ChangeEvent,
    isExpanded: boolean
  ): void => {
    this.setState({ expanded: isExpanded ? panel : false });
  };

  clearActiveAnnotation = (): void => {
    this.annotationsObject.setAnnotationCoordinates([]);
    this.annotationsObject.setAnnotationBrushStrokes([]);
    this.setState((prevState) => ({
      callRedraw: prevState.callRedraw + 1,
    }));
  };

  changeSlice = (e: ChangeEvent, value: number): void => {
    this.setState(
      {
        sliceIndex: value,
      },
      this.mixChannels
    );
  };

  toggleChannelAtIndex = (index: number): void => {
    this.setState((prevState: State) => {
      const { channels } = prevState;
      channels[index] = !channels[index];
      return { channels };
    }, this.mixChannels);
  };

  render = (): ReactNode => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container disableGutters>
        <AppBar>
          <Toolbar>
            <UploadImage
              setUploadedImage={this.setUploadedImage}
              spanElement={
                /* eslint-disable react/jsx-wrap-multilines */
                <Button aria-label="upload-picture" component="span">
                  {<img src="\examples\upload-icon.svg" />}
                </Button>
              }
            />{" "}
          </Toolbar>
          <Typography>
            {<img src="\examples\gliff-master-black.png" width="50px" />}
          </Typography>
        </AppBar>
        <Toolbar />

        <Grid container spacing={0} justify="center" wrap="nowrap">
          <Grid item style={{ width: "85%", position: "relative" }}>
            <BackgroundCanvas
              scaleAndPan={this.state.scaleAndPan}
              displayedImage={this.state.displayedImage}
              canvasPositionAndSize={this.state.viewportPositionAndSize}
              setCanvasPositionAndSize={this.setViewportPositionAndSize}
            />

            <SplineCanvas
              scaleAndPan={this.state.scaleAndPan}
              activeTool={this.state.activeTool}
              annotationsObject={this.annotationsObject}
              displayedImage={this.state.displayedImage}
              canvasPositionAndSize={this.state.viewportPositionAndSize}
              setCanvasPositionAndSize={this.setViewportPositionAndSize}
              callRedraw={this.state.callRedraw}
            />

            <PaintbrushCanvas
              scaleAndPan={this.state.scaleAndPan}
              brushType={this.state.activeTool}
              annotationsObject={this.annotationsObject}
              displayedImage={this.state.displayedImage}
              canvasPositionAndSize={this.state.viewportPositionAndSize}
              setCanvasPositionAndSize={this.setViewportPositionAndSize}
              callRedraw={this.state.callRedraw}
            />

            {this.slicesData.length > 1 && (
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
          <Grid item style={{ width: 200, position: "relative" }}>
            <div style={{ height: 200 }}>
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
              />
            </div>

            <Grid container justify="center">
              <ButtonGroup size="small" style={{ margin: "5px" }}>
                <Tooltip title="Zoom out">
                  <Button id="zoom-out" onClick={this.decrementScale}>
                    <ZoomOut />
                  </Button>
                </Tooltip>
                <Tooltip title="Reset zoom and pan">
                  <Button id="reset" onClick={this.resetScaleAndPan}>
                    <AspectRatio />
                  </Button>
                </Tooltip>
                <Tooltip title="Zoom in">
                  <Button id="zoom-in" onClick={this.incrementScale}>
                    <ZoomIn />
                  </Button>
                </Tooltip>
              </ButtonGroup>

              <ButtonGroup size="small" style={{ marginBottom: "5px" }}>
                <Tooltip title="Pan up">
                  <Button id="pan-up" onClick={this.incrementPanY}>
                    <KeyboardArrowUp />
                  </Button>
                </Tooltip>
                <ButtonGroup size="small">
                  <Tooltip title="Pan left">
                    <Button id="pan-left" onClick={this.incrementPanX}>
                      <KeyboardArrowLeft />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Pan right">
                    <Button id="pan-right" onClick={this.decrementPanX}>
                      <KeyboardArrowRight />
                    </Button>
                  </Tooltip>
                </ButtonGroup>
                <Tooltip title="Pan down">
                  <Button id="pan-down" onClick={this.decrementPanY}>
                    <KeyboardArrowDown />
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Grid>

            <Accordion
              expanded={this.state.expanded === "labels-toolbox"}
              onChange={this.handleToolboxChange("labels-toolbox")}
            >
              <AccordionSummary expandIcon={<ExpandMore />} id="labels-toolbox">
                <Typography>Annotations</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container justify="center">
                  <ButtonGroup>
                    <Tooltip title="Annotate new object">
                      <Button id="addAnnotation" onClick={this.addAnnotation}>
                        <Add />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Clear selected annotation">
                      <Button
                        id="clear-annotation"
                        onClick={this.clearActiveAnnotation}
                      >
                        <Delete />
                      </Button>
                    </Tooltip>
                  </ButtonGroup>

                  <Labels
                    annotationObject={this.annotationsObject}
                    presetLabels={this.presetLabels}
                    updatePresetLabels={this.updatePresetLabels}
                    activeAnnotationID={this.state.activeAnnotationID}
                  />
                </Grid>
              </AccordionDetails>
            </Accordion>

            <BackgroundUI
              expanded={this.state.expanded === "background-toolbox"}
              onChange={this.handleToolboxChange("background-toolbox")}
              channels={this.state.channels}
              toggleChannelAtIndex={this.toggleChannelAtIndex}
            />

            <PaintbrushUI
              expanded={
                this.state.expanded === "paintbrush-toolbox" ||
                ["paintbrush", "eraser"].includes(this.state.activeTool)
              }
              activeTool={this.state.activeTool}
              onChange={this.handleToolboxChange("paintbrush-toolbox")}
              activateTool={this.activateTool}
            />

            <SplineUI
              expanded={
                this.state.expanded === "spline-toolbox" ||
                ["spline"].includes(this.state.activeTool)
              }
              activeTool={this.state.activeTool}
              onChange={this.handleToolboxChange("spline-toolbox")}
              activateTool={this.activateTool}
            />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}
