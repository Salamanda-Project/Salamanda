import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Import global styles
import "./styles/tailwind.css";
import "./styles/index.css";
import "./styles/font.css";

// Get the root container
const container = document.getElementById("root");

// Ensure the container exists before rendering
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root container not found.");
}
