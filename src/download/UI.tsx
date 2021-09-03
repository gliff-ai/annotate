import { ReactElement, MouseEvent, Component } from "react";
import { Menu, MenuItem, withStyles, WithStyles } from "@material-ui/core";
import { ImageFileInfo } from "@gliff-ai/upload";
import { BaseIconButton } from "@gliff-ai/style";
import { keydownListener } from "@/keybindings";
import { Annotations } from "@/annotation";
import { downloadPaintbrushAsTiff } from "@/download/DownloadAsTiff";
import { downloadAnnotationsAsJson } from "@/download/DownloadAsJson";
import { Tools } from "@/tooltips";
import { Toolboxes } from "@/Toolboxes";

const styles = {
  menu: {
    borderRadius: "9px",
    opacity: 1,
  },
  text: {
    fontSize: "17px",
    letterSpacing: "0px",
    color: "#2B2F3A",
    fontWeight: 400,
  },
  menuItem: {
    opacity: "1",
    "&:focus": {
      background: "#02FFAD 0% 0% no-repeat padding-box",
    },
    "&:hover": {
      background: "#02FFAD 0% 0% no-repeat padding-box",
    },
  },
  paper: {
    marginTop: "90px",
    marginLeft: "-20px",
  },
  tooltip: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #dadde9",
    opacity: "1",
    marginTop: "30px",
    marginLeft: "0px",
  },
};

const events = ["openDownloadDropdown"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}
interface Props extends WithStyles<typeof styles> {
  annotationsObject: Annotations;
  imageFileInfo: ImageFileInfo;
  isTyping: () => boolean;
  redraw: number;
}

type ItemMenu = {
  key: string;
  text: string;
  onClick: () => void;
};
interface State {
  anchorEl: HTMLButtonElement | null;
  menuItems: ItemMenu[];
}
class DownloadUI extends Component<Props, State> {
  refDownloadPopover: HTMLButtonElement | null;

  constructor(props: Props) {
    super(props);
    this.state = {
      anchorEl: null,
      menuItems: [],
    };
    this.refDownloadPopover = null;
  }

  componentDidMount = () => {
    this.prepareMenuItems();

    document.addEventListener("keydown", keydownListener);

    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  };

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  componentDidUpdate = (prevProps: Props): void => {
    if (prevProps.redraw !== this.props.redraw) {
      this.prepareMenuItems();
    }
  };

  handleEvent = (event: Event): void => {
    if (event.detail === "download") {
      this[event.type]?.call(this);
    }
  };

  openDownloadDropdown = (): void => {
    if (this.props.isTyping()) return;
    this.setState({ anchorEl: this.refDownloadPopover });
  };

  handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  prepareMenuItems = () => {
    const toolboxes: string[] = [];
    const newMenuItems: ItemMenu[] = [];

    this.props.annotationsObject.getAllAnnotations().forEach((a) => {
      if (!toolboxes.includes(a.toolbox)) {
        toolboxes.push(a.toolbox);
      }
    });

    toolboxes.forEach((toolbox) => {
      if (toolbox === Toolboxes.paintbrush) {
        newMenuItems.push({
          key: "paintbrush-tiff",
          text: "Export paintbrush as Tiff",
          onClick: () =>
            downloadPaintbrushAsTiff(
              this.props.annotationsObject,
              this.props.imageFileInfo
            ),
        });
      }
      newMenuItems.push({
        key: `${toolbox}-json`,
        text: `Export ${toolbox} as JSON`,
        onClick: () =>
          downloadAnnotationsAsJson(
            this.props.annotationsObject,
            toolbox,
            this.props.imageFileInfo.fileName
          ),
      });
    });
    this.setState({ menuItems: newMenuItems });
  };

  render = (): ReactElement => {
    const { classes } = this.props;
    return (
      <>
        <BaseIconButton
          tooltip={Tools.download}
          onClick={this.handleOpen}
          fill={false}
          hasAvatar={false}
          tooltipPlacement="bottom"
          buttonSize="medium"
          setRefCallback={(ref) => {
            this.refDownloadPopover = ref;
          }}
        />
        <Menu
          id="download-menu"
          className={classes.menu}
          anchorEl={this.state.anchorEl}
          keepMounted
          open={Boolean(this.state.anchorEl)}
          onClick={this.handleClose}
          getContentAnchorEl={null}
          PopoverClasses={{ paper: classes.paper }}
        >
          {this.state.menuItems.map((item) => (
            <MenuItem
              key={item.key}
              className={`${classes.menuItem} ${classes.text}`}
              onClick={item.onClick}
              dense
            >
              {item.text}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  };
}

export const Download = withStyles(styles)(DownloadUI);
