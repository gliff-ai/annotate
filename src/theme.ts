import { red } from "@material-ui/core/colors";
import { ThemeProvider, createMuiTheme, Theme } from "@material-ui/core/styles";
import { secondary } from "./palette";

const theme: Theme = createMuiTheme({
  palette: {
    type: "dark",
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
        padding: "10px",
      },
    },
    MuiGrid: {
      container: {
        marginTop: "50px",
      },
    },
    MuiPaper: {
      root: {
        marginBottom: "20px",
      },
    },
    MuiAppBar: {
      root: {},
    },
  },
  props: {
    MuiButton: {
      disableRipple: true,
    },
  },
});

export { ThemeProvider, theme };
