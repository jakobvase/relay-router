import { JSResource } from "JSResource";
import { Link } from "Link";
import { RouteRenderer } from "RouteRenderer";
import RoutingContext from "RoutingContext";
import { createRouter, RouteConfig as _RouteConfig } from "./createRouter";

export type RouteConfig = _RouteConfig;

export default {
  createRouter,
  Link,
  JSResource,
  RoutingContext,
  RouteRenderer,
};
