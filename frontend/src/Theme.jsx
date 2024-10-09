import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#5536DA",
      // contrastText: "#ffffff",
    },
    secondary: {
      main: "#BDBDBD",
      contrastText: "#ffffff",
    },
    background: {
      main: "#F8F9FD",
      default: "#00000",
    },
    red: {
      main: "#cc0c0c",
    },
    default: {
      main: "#fcc0c0",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h1: {
      fontSize: "2rem",
    },
  },
});

export default theme;
