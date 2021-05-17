import { red } from "@material-ui/core/colors";
import { ThemeProvider, createMuiTheme, Theme } from "@material-ui/core/styles";

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
  },
});

export { ThemeProvider, theme };
