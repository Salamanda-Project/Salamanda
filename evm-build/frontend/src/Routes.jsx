import React from "react";
import { useRoutes } from "react-router-dom";
import NotFound from "../src/pages/NotFound";
import Tokenlaunchpad from "../src/pages/TokenLaunchpad/index";
import Createliquidity from "../src/pages/CreateLiquidity/index";

const ProjectRoutes = () => {
  const routes = [
    { path: "/", element: <Tokenlaunchpad /> },
    { path: "create-liquidity", element: <Createliquidity /> },
    { path: "*", element: <NotFound /> }, // Catch-all for 404
  ];

  return useRoutes(routes);
};

export default ProjectRoutes;
