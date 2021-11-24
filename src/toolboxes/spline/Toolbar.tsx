import { Component, ReactElement, MouseEvent } from "react";
import { ButtonGroup, Popper } from "@material-ui/core";
import { IconButton, icons } from "@gliff-ai/style";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { getShortcut } from "@/keybindings";
import { useSplineStore } from "./Store";
import { useMountEffect } from "@/hooks/use-mountEffect";

const events = ["selectSpline"] as const;

const ToolboxName: Toolbox = "spline";

interface SubmenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  openSubmenu: () => void;
}

const Submenu = (props: SubmenuProps): ReactElement => {
  const [spline, setSpline] = useSplineStore();

  const submenuEvents = [
    "selectSpline",
    "selectLassoSpline",
    // "closeSpline", // This is listened for in the canvas, the keybinding calls that directly
    // "convertSpline", // This is listened for in the canvas, the keybinding calls that directly
  ] as const;

  const selectSpline = () => {
    setSpline({ splineType: "Spline" });

    return true;
  };

  const selectLassoSpline = () => {
    setSpline({ splineType: "Lasso Spline" });

    return true;
  };

  // function selectMagicSpline() {
  //   setSpline({ splineType: Tools.magicspline.name });
  // }

  const closeSpline = () => {
    document.dispatchEvent(
      new CustomEvent("closeSpline", { detail: Toolboxes.spline })
    );

    return true;
  };

  const convertSpline = () => {
    document.dispatchEvent(
      new CustomEvent("convertSpline", { detail: Toolboxes.spline })
    );

    return true;
  };

  const tools = [
    {
      name: "Spline",
      icon: icons.spline,
      event: selectSpline,
      active: () => spline.splineType === "Spline",
    },
    {
      name: "Lasso Spline",
      icon: icons.lassoSpline,
      event: selectLassoSpline,
      active: () => spline.splineType === "Lasso Spline",
    },

    {
      name: "Close Active Spline",
      icon: icons.closeSpline,
      event: closeSpline,
      active: () => false,
    },
    {
      name: "Convert Spline To Paintbrush",
      icon: icons.convert,
      event: convertSpline,
      active: () => false,
    },

    // TODO:
    // {
    //   name: "Convert Spline to Paintbrush and Fill",
    // },
    // {
    //   name: "Magic Spline",
    // },
  ];

  useMountEffect(() => {
    const submenuEventFunctions = {
      selectSpline,
      selectLassoSpline,
      closeSpline,
      convertSpline,
    };

    const handleEvent = (event: Event): void => {
      if (event.detail === Toolboxes.spline) {
        // If the function we call returns true, also open the popup
        const popup = submenuEventFunctions[event.type]?.call(this) as boolean;
        if (popup) {
          props.openSubmenu();
        }
      }
    };

    for (const event of submenuEvents) {
      document.addEventListener(event, handleEvent);
    }

    // Specify how to clean up after this effect:
    return function cleanup() {
      for (const event of submenuEvents) {
        document.removeEventListener(event, handleEvent);
      }
    };
  });

  if (props.anchorElement === null) return null;

  return (
    <Popper
      open={props.isOpen}
      anchorEl={props.anchorElement}
      placement="right"
      style={{ display: "flex" }}
      modifiers={{
        offset: {
          enabled: true,
          offset: "10, 10",
        },
      }}
    >
      <ButtonGroup size="small" id="spline-toolbar">
        {tools.map(({ icon, name, event, active }) => (
          <IconButton
            key={name}
            icon={icon}
            tooltip={{
              name,
              ...getShortcut(`${ToolboxName}.${event.name}`),
            }}
            onClick={event}
            fill={active()}
            id={`id-${name.toLowerCase().replace(/ /g, "-")}`}
          />
        ))}
      </ButtonGroup>
    </Popper>
  );
};

interface Event extends CustomEvent {
  type: typeof events[number];
}

interface Props {
  active: boolean; // toolbox is active
  activateToolbox: (activeToolbox: Toolbox) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
  anchorElement: HTMLButtonElement | null;
  isTyping: () => boolean;
}

class Toolbar extends Component<Props> {
  private refSplinePopover: HTMLButtonElement;

  constructor(props: Props) {
    super(props);
    this.refSplinePopover = null;
  }

  openSubmenu = (): void => {
    if (this.props.isTyping()) return;
    this.props.handleOpen()(this.refSplinePopover);
    this.props.activateToolbox(ToolboxName);
  };

  render = (): ReactElement => (
    <>
      <ButtonGroup style={{ all: "revert" }}>
        <IconButton
          tooltip={{
            name: "Spline",
            ...getShortcut("spline.selectSpline"),
          }}
          icon={icons.spline}
          onClick={this.openSubmenu}
          fill={this.props.active}
          setRefCallback={(ref: HTMLButtonElement) => {
            this.refSplinePopover = ref;
          }}
          id="id-spline-toolbox"
        />
      </ButtonGroup>

      <Submenu
        isOpen={Boolean(this.props.anchorElement === this.refSplinePopover)}
        anchorElement={this.props.anchorElement}
        openSubmenu={this.openSubmenu}
      />
    </>
  );
}

export { Toolbar, ToolboxName };
