import { Button, Modal, Box, Typography } from "@material-ui/core";
import { ReactElement, useEffect, useState } from "react";
import { keybindings } from "@/keybindings/keybindings";
import { getShortcut } from "@/keybindings/index";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  bottom: "-40%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  overflow: "scroll",
};

const events = ["openKeybinds"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

const KeybindPopup = (): ReactElement => {
  const [open, setOpen] = useState(false);
  // const classes = useStyles();
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEvent = (event: Event): void => {
    if (event.detail === "ui") {
      setOpen(true);
    }
  };

  useEffect(() => {
    document.addEventListener(events[0], handleEvent);

    return function cleanup() {
      document.removeEventListener(events[0], handleEvent);
    };
  });
  const shortcuts = Object.entries(keybindings).map(([, [event, text]]) => {
    const shortcut = getShortcut(event);

    return (
      <Typography key={event}>
        {shortcut.shortcutSymbol
          ? `${shortcut.shortcutSymbol.toUpperCase()} + `
          : null}
        {shortcut.shortcut.toUpperCase()}&nbsp;&nbsp;&nbsp;&nbsp;{text}{" "}
      </Typography>
    );
  });

  return (
    <>
      <Button onClick={handleOpen}>Shortcuts</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Shortcut Keys
          </Typography>
          <br />
          <Typography id="modal-modal-description" component="ul">
            {shortcuts.map((s, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={i}>{s}</li>
            ))}
          </Typography>
        </Box>
      </Modal>
    </>
  );
};

export { KeybindPopup };
