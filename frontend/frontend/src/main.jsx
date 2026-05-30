import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure bootstrap CSS is loaded if needed
import "bootstrap-icons/font/bootstrap-icons.css"; // Load local bootstrap icons
import App from "./App";

// Suppress false-positive Recharts layout warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    args[0].includes("The width") &&
    args[0].includes("of chart should be greater than 0")
  ) {
    return;
  }
  originalWarn(...args);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
