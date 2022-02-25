import React from "react";
import { Context } from "./createRouter";

const RoutingContext = React.createContext<Context>(null as any);

/**
 * A custom context instance for our router type
 */
export default RoutingContext;
