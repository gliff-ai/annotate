import { ThemeProvider, createMuiTheme, Theme } from "@material-ui/core";

const theme: Theme = createMuiTheme({
  palette: {
    primary: {
      main: "#02FFAD",
    },
    secondary: {
      main: "#AE79FF",
    },
  },
  typography: {
    fontFamily: "Roboto",
  },
  shape: {
    borderRadius: 6,
  },

  overrides: {
    MuiButton: {
      root: {
        color: "#000000",
      },
    },

    MuiSlider: {
      root: {
        color: "#000000",
        textAlign: "center",
      },
      vertical: {
        height: "auto",
      },
    },

    MuiPopover: {
      root: {
        marginLeft: "20px",
      },
    },

    MuiButtonGroup: {
      root: {
        border: "1px solid #dadde9",
        borderRadius: "9px",
        padding: "8px",
      },
    },

    MuiAvatar: {
      colorDefault: {
        backgroundColor: "#fff",
        "&:hover": {
          backgroundColor: "#02FFAD",
        },
      },
    },
  },

  props: {
    MuiButton: {
      disableRipple: true,
    },

    MuiButtonGroup: {
      orientation: "vertical",
      variant: "outlined",
      disableRipple: true,
    },

    MuiPopover: {
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
      transformOrigin: {
        vertical: "top",
        horizontal: "left",
      },
    },
  },
});

export { ThemeProvider, theme };
