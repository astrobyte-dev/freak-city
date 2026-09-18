import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-500-italic.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "../styles.css";
import TrialApp from "./TrialApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TrialApp />
  </React.StrictMode>,
);
