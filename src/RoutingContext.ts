import React from "react";
import { createRouter } from "./createRouter";

const RoutingContext = React.createContext<
  ReturnType<typeof createRouter>["context"]
>(null as any);

/**
 * A custom context instance for our router type
 */
export default RoutingContext;
