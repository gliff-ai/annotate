import { createTheme } from "@material-ui/core/styles";
import { ThemeProvider, Theme } from "@material-ui/core";

const theme: Theme = createTheme({
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
    MuiCssBaseline: {
      "@global": {
        html: {
          height: "100%",
        },
        body: {
          height: "100%",
        },
        "#react-container": {
          overflow: "hidden",
          height: "100%",
        },
      },
    },
    MuiButton: {
      root: {
        color: "#000000",
      },
    },
    MuiIconButton: {
      root: {
        "&:hover": {
          backgroundColor: "transparent",
        },
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
        background: "#fafafa",
        width: "63px",
      },
    },
    MuiDivider: {
      root: {
        marginTop: "-15px",
        width: "90%",
        marginLeft: "12px",
        marginBottom: "17px",
      },
    },
    MuiAvatar: {
      colorDefault: {
        backgroundColor: "#fff",
        "&:hover": {
          backgroundColor: "#02FFAD",
        },
        "&:hover svg": {
          fill: "#000000",
        },
      },
    },
    MuiContainer: {
      root: {
        height: "100%",
        width: "100%",
      },
    },
  },
  props: {
    MuiIconButton: {
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
