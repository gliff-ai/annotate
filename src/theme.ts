import { red } from "@material-ui/core/colors";
import { ThemeProvider, createMuiTheme, Theme } from "@material-ui/core/styles";

const theme: Theme = createMuiTheme({
  palette: {
    primary: {
      main: "#FFFFFF",
    },
    secondary: {
      main: "#02FFAD",
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
        borderRadius: "9px",
      },
    },

    MuiToolbar: {
      root: {
        boxShadow: "0px, 0px, 0px, 0px",
        // background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
      },
    },
  },

  props: {
    MuiButton: {
      disableRipple: true,
    },

    MuiButtonGroup: {
      orientation: "vertical",
      color: "secondary",
      variant: "outlined",
    },
  },
});

export { ThemeProvider, theme };
