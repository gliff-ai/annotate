import React, { Component, ChangeEvent, ReactNode } from "react";

import { Annotations } from "./annotation";

import {
  AppBar,
  Container,
  Toolbar,
  Tooltip,
  IconButton,
  ButtonGroup,
  Grid,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  CssBaseline,
} from "@material-ui/core";
import {
  Add,
  ZoomOut,
  ZoomIn,
  AspectRatio,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardArrowUp,
  ExpandMore,
  AllOut,
  Brush,
} from "@material-ui/icons";
import { ThemeProvider, createMuiTheme, Theme } from "@material-ui/core/styles";

import { BackgroundCanvas, BackgroundMinimap } from "./toolboxes/background";
import { SplineCanvas } from "./toolboxes/spline";
import { PaintbrushCanvas } from "./toolboxes/paintbrush";

export class UserInterface extends Component {
  state: {
    scaleAndPan: {
      x: number;
      y: number;
      scale: number;
    };
    activeTool?: "spline" | "paintbrush";
    imageWidth: number;
    imageHeight: number;
    activeAnnotationID: number;

    brushSize: number;

    viewportPositionAndSize: {
      top: number;
      left: number;
      width: number;
      height: number;
    };

    expanded: string | boolean;
  };

  annotationsObject: Annotations;

  theme: Theme;

  imageSource: string;

  constructor(props: never) {
    super(props);
    this.annotationsObject = new Annotations();
    this.state = {
      scaleAndPan: {
        scale: 1,
        x: 0,
        y: 0,
      },
      imageWidth: 0,
      imageHeight: 0,
      activeTool: "paintbrush",
      activeAnnotationID: null,
      brushSize: 20,
      viewportPositionAndSize: { top: 0, left: 0, width: 768, height: 768 },
      expanded: false,
    };

    this.theme = createMuiTheme({
      palette: {
        type: "dark",
      },
    });
    this.imageSource = "public/zebrafish-heart.jpg";

    this.annotationsObject.addAnnotation(this.state.activeTool);
  }

  setViewportPositionAndSize = (viewportPositionAndSize: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  }): void => {
    viewportPositionAndSize.top ??= this.state.viewportPositionAndSize.top;
    viewportPositionAndSize.left ??= this.state.viewportPositionAndSize.left;
    viewportPositionAndSize.width ??= this.state.viewportPositionAndSize.width;
    viewportPositionAndSize.height ??= this.state.viewportPositionAndSize.height;
    this.setState({ viewportPositionAndSize: viewportPositionAndSize });
  };

  setScaleAndPan = (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }): void => {
    // the is for passing down to the minimap
    scaleAndPan.scale ??= this.state.scaleAndPan.scale;
    scaleAndPan.x ??= this.state.scaleAndPan.x;
    scaleAndPan.y ??= this.state.scaleAndPan.y;
    this.setState({ scaleAndPan: scaleAndPan });
  };

  resetScaleAndPan = (): void => {
    this.setScaleAndPan({ scale: 1, x: 0, y: 0 });
  };

  incrementScale = (): void => {
    let panMultiplier =
      (1 + this.state.scaleAndPan.scale) / this.state.scaleAndPan.scale;
    this.setScaleAndPan({
      x: this.state.scaleAndPan.x * panMultiplier,
      y: this.state.scaleAndPan.y * panMultiplier,
      scale: this.state.scaleAndPan.scale + 1,
    });
  };

  decrementScale = (): void => {
    // Zoom out only if zoomed in.
    if (this.state.scaleAndPan.scale > 1) {
      let panMultiplier =
        (this.state.scaleAndPan.scale - 1) / this.state.scaleAndPan.scale;
      this.setScaleAndPan({
        x: this.state.scaleAndPan.x * panMultiplier,
        y: this.state.scaleAndPan.y * panMultiplier,
        scale: this.state.scaleAndPan.scale - 1,
      });
    }
  };

  incrementPanX = (): void => {
    // negative is left, +ve is right...
    this.setScaleAndPan({ x: this.state.scaleAndPan.x + 10 });
  };

  decrementPanX = (): void => {
    // negative is left, +ve is right...
    this.setScaleAndPan({ x: this.state.scaleAndPan.x - 10 });
  };

  incrementPanY = (): void => {
    // negative is up, +ve is down...
    this.setScaleAndPan({ y: this.state.scaleAndPan.y + 10 });
  };

  decrementPanY = (): void => {
    // negative is up, +ve is down...
    this.setScaleAndPan({ y: this.state.scaleAndPan.y - 10 });
  };

  incrementBrush = (): void => {
    this.setState({ brushSize: this.state.brushSize + 10 });
  };

  updateImageDimensions = (imageWidth: number, imageHeight: number): void => {
    this.setState({
      imageWidth: imageWidth,
      imageHeight: imageHeight,
    });
  };

  toggleSpline = (): void => {
    if (this.state.activeTool === "spline") {
      this.setState({ activeTool: null });
    } else {
      this.setState({ activeTool: "spline" });
    }
  };

  togglePaintbrush = (): void => {
    if (this.state.activeTool === "paintbrush") {
      this.setState({ activeTool: null });
    } else {
      this.setState({ activeTool: "paintbrush" });
    }
  };

  addAnnotation = (): void => {
    this.annotationsObject.addAnnotation(this.state.activeTool);
    this.setState({
      activeAnnotationID: this.annotationsObject.getActiveAnnotationID(),
    });
  };

  handleToolboxChange = (panel: string) => (
    event: ChangeEvent,
    isExpanded: boolean
  ): void => {
    this.setState({ expanded: isExpanded ? panel : false });
  };

  render = (): ReactNode => {
    return (
      <ThemeProvider theme={this.theme}>
        <CssBaseline />
        <Container disableGutters={true}>
          <AppBar>
            <Toolbar>
              <Tooltip title="Annotate new object">
                <IconButton id={"addAnnotation"} onClick={this.addAnnotation}>
                  <Add />
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
          <Toolbar />

          <Grid container spacing={0} justify="center" wrap="nowrap">
            <Grid item style={{ width: "85%", position: "relative" }}>
              <BackgroundCanvas
                scaleAndPan={this.state.scaleAndPan}
                imgSrc={this.imageSource}
                updateImageDimensions={this.updateImageDimensions}
                canvasPositionAndSize={this.state.viewportPositionAndSize}
                setCanvasPositionAndSize={this.setViewportPositionAndSize}
              />

              <SplineCanvas
                scaleAndPan={this.state.scaleAndPan}
                isActive={this.state.activeTool === "spline"}
                annotationsObject={this.annotationsObject}
                imageWidth={this.state.imageWidth}
                imageHeight={this.state.imageHeight}
                canvasPositionAndSize={this.state.viewportPositionAndSize}
                setCanvasPositionAndSize={this.setViewportPositionAndSize}
              />

              <PaintbrushCanvas
                scaleAndPan={this.state.scaleAndPan}
                isActive={this.state.activeTool === "paintbrush"}
                annotationsObject={this.annotationsObject}
                imageWidth={this.state.imageWidth}
                imageHeight={this.state.imageHeight}
                brushRadius={this.state.brushSize}
                canvasPositionAndSize={this.state.viewportPositionAndSize}
                setCanvasPositionAndSize={this.setViewportPositionAndSize}
              />
            </Grid>

            <Grid item style={{ width: 200, position: "relative" }}>
              <div style={{ height: 200 }}>
                <BackgroundMinimap
                  scaleAndPan={this.state.scaleAndPan}
                  setScaleAndPan={this.setScaleAndPan}
                  imgSrc={this.imageSource}
                  imageWidth={this.state.imageWidth}
                  imageHeight={this.state.imageHeight}
                  canvasPositionAndSize={this.state.viewportPositionAndSize}
                  minimapPositionAndSize={{
                    top: 0,
                    left: 0,
                    width: 200,
                    height: 200,
                  }}
                />
              </div>

              <Grid container justify="center">
                <ButtonGroup>
                  <Tooltip title="Zoom out">
                    <IconButton id={"zoom-out"} onClick={this.decrementScale}>
                      <ZoomOut />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset zoom and pan">
                    <IconButton id={"reset"} onClick={this.resetScaleAndPan}>
                      <AspectRatio />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Zoom in">
                    <IconButton id={"zoom-in"} onClick={this.incrementScale}>
                      <ZoomIn />
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>

                <ButtonGroup orientation="vertical">
                  <Tooltip title="Pan up">
                    <IconButton id={"pan-up"} onClick={this.incrementPanY}>
                      <KeyboardArrowUp />
                    </IconButton>
                  </Tooltip>
                  <ButtonGroup>
                    <Tooltip title="Pan left">
                      <IconButton id={"pan-left"} onClick={this.incrementPanX}>
                        <KeyboardArrowLeft />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Pan right">
                      <IconButton id={"pan-right"} onClick={this.decrementPanX}>
                        <KeyboardArrowRight />
                      </IconButton>
                    </Tooltip>
                  </ButtonGroup>
                  <Tooltip title="Pan down">
                    <IconButton id={"pan-down"} onClick={this.decrementPanY}>
                      <KeyboardArrowDown />
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>
              </Grid>

              <Accordion
                expanded={this.state.expanded === "paintbrush-toolbox"}
                onChange={this.handleToolboxChange("paintbrush-toolbox")}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  id="paintbrush-toolbox"
                >
                  <Typography>Paintbrushes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Tooltip title="Activate paintbrush">
                    <IconButton
                      id={"activate-paintbrush"}
                      onClick={this.togglePaintbrush}
                    >
                      <Brush />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Increase brush size">
                    <IconButton
                      id={"increase-paintbrush-radius"}
                      onClick={this.incrementBrush}
                    >
                      <AllOut />
                    </IconButton>
                  </Tooltip>
                </AccordionDetails>
              </Accordion>
              <Accordion
                expanded={this.state.expanded === "spline-toolbox"}
                onChange={this.handleToolboxChange("spline-toolbox")}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  id="spline-toolbox"
                >
                  <Typography>Splines</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Tooltip title="Activate spline">
                    <IconButton
                      id={"activate-spline"}
                      onClick={this.toggleSpline}
                    >
                      <Brush />
                    </IconButton>
                  </Tooltip>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Container>
      </ThemeProvider>
    );
  };
}
