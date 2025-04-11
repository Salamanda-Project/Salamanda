import React from "react";
import Routes from "./Routes";
import { BrowserRouter as Router } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { config } from "../src/config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <Router>
          <Routes />
        </Router>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;