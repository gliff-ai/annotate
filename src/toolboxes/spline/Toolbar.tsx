import { Component, ReactElement, MouseEvent, useEffect } from "react";
import { IconButton, icons, Popper, ButtonGroup } from "@gliff-ai/style";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { getShortcut } from "@/keybindings";
import { useSplineStore } from "./Store";

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
    "selectBezierSpline",
    // "closeSpline", // This is listened for in the canvas, the keybinding calls that directly
    // "convertSpline", // This is listened for in the canvas, the keybinding calls that directly
  ] as const;

  const selectSpline = () => {
    if (spline.splineType === "Bezier Spline") {
      document.dispatchEvent(
        new CustomEvent("toggleBezier", { detail: Toolboxes.spline })
      );
    }

    setSpline({ splineType: "Spline" });

    return true;
  };

  const selectLassoSpline = () => {
    if (spline.splineType === "Bezier Spline") {
      document.dispatchEvent(
        new CustomEvent("toggleBezier", { detail: Toolboxes.spline })
      );
    }

    setSpline({ splineType: "Lasso Spline" });

    return true;
  };

  // function selectMagicSpline() {
  //   setSpline({ splineType: Tools.magicspline.name });
  // }

  const closeSpline = () => {
    document.dispatchEvent(
      new CustomEvent("toggleSplineClosed", { detail: Toolboxes.spline })
    );

    return true;
  };

  const convertSpline = () => {
    document.dispatchEvent(
      new CustomEvent("convertSpline", { detail: Toolboxes.spline })
    );

    return true;
  };

  const selectBezierSpline = () => {
    if (spline.splineType !== "Bezier Spline") {
      document.dispatchEvent(
        new CustomEvent("toggleBezier", { detail: Toolboxes.spline })
      );
    }
    setSpline({ splineType: "Bezier Spline" });

    return true;
  };

  const handleClickAway = () => {};

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
      name: "Bezier Spline",
      icon: icons.bezierSpline,
      event: selectBezierSpline,
      active: () => spline.splineType === "Bezier Spline",
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

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const submenuEventFunctions = {
      selectSpline,
      selectLassoSpline,
      selectBezierSpline,
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
  }, [spline]); // need to re-bind the event handlers whenever spline changes, because they seem to use the value spline when they're bound rather than the current value
  /* eslint-enable react-hooks/exhaustive-deps */

  if (props.anchorElement === null) return null;

  return (
    <Popper
      open={props.isOpen}
      anchorEl={props.anchorElement}
      handleClickAway={handleClickAway}
      el={
        <ButtonGroup size="small" id="spline-toolbar" variant="text">
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
              size="small"
            />
          ))}
        </ButtonGroup>
      }
    />
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
}

class Toolbar extends Component<Props> {
  private refSplinePopover: HTMLButtonElement;

  constructor(props: Props) {
    super(props);
    this.refSplinePopover = null;
  }

  openSubmenu = (): void => {
    this.props.handleOpen()(this.refSplinePopover);
    this.props.activateToolbox(ToolboxName);
  };

  render = (): ReactElement => (
    <>
      <ButtonGroup style={{ all: "revert" }} variant="text">
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
          size="small"
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
