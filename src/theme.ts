import { ThemeProvider, createMuiTheme, Theme } from "@material-ui/core/styles";

const theme: Theme = createMuiTheme({
  palette: {
    type: "dark",
  },
});

export { ThemeProvider, theme };
