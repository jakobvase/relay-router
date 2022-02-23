import { JSResource } from "JSResource";
import { Link } from "Link";
import { RouteRenderer } from "RouteRenderer";
import RoutingContext from "RoutingContext";
import { createRouter } from "./createRouter";
import { RouteConfig as _RouteConfig } from "matchRoutes";

export type RouteConfig = _RouteConfig;
export { createRouter, Link, JSResource, RouteRenderer, RoutingContext };
