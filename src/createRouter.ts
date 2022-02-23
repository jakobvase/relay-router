import { BrowserHistoryOptions, createBrowserHistory, Location } from "history";
import { RouteMatch } from "react-router";
import { matchRoutes, RouteObject as RRRouteConfig } from "react-router-dom";
import { Resource } from "./JSResource";

export type RouteConfig = Omit<RRRouteConfig, "element"> & {
  element?: Resource<React.ReactNode>;
  prepare?: (params?: any /* url params object */) => any; //PreloadedQuery;
};

interface MatchedRoute<
  Params extends { [K in keyof Params]?: string },
  TRouteConfig extends RouteConfig = RouteConfig
> {
  route: TRouteConfig;
  match: RouteMatch;
}

type Subscriber = (nextEntry: {
  location: Location;
  entries: {
    element: Resource<React.ReactNode> | undefined;
    prepared: any;
    routeData: RouteMatch;
  }[];
}) => void;

/**
 * A custom router built from the same primitives as react-router. Each object in `routes`
 * contains both a Component and a prepare() function that can preload data for the component.
 * The router watches for changes to the current location via the `history` package, maps the
 * location to the corresponding route entry, and then preloads the code and data for the route.
 */
export const createRouter = (
  routes: RouteConfig[],
  options?: BrowserHistoryOptions
) => {
  // Initialize history
  const history = createBrowserHistory(options);

  // Find the initial match and prepare it
  const initialMatches = matchRoute(
    routes,
    history.location
  ) as unknown as MatchedRoute<{}, RouteConfig>[];
  const initialEntries = prepareMatches(initialMatches);
  let currentEntry = {
    location: history.location,
    entries: initialEntries,
  };

  // maintain a set of subscribers to the active entry
  let nextId = 0;
  const subscribers = new Map<number, Subscriber>();

  // Listen for location changes, match to the route entry, prepare the entry,
  // and notify subscribers. Note that this pattern ensures that data-loading
  // occurs *outside* of - and *before* - rendering.
  const cleanup = history.listen(({ location }) => {
    if (location.pathname === currentEntry.location.pathname) {
      return;
    }
    const matches = matchRoute(routes, location) as unknown as MatchedRoute<
      {},
      RouteConfig
    >[];
    const entries = prepareMatches(matches);
    const nextEntry = {
      location,
      entries,
    };
    currentEntry = nextEntry;
    subscribers.forEach((cb) => cb(nextEntry));
  });

  // The actual object that will be passed on the RoutingConext.
  const context = {
    history,
    get() {
      return currentEntry;
    },
    preloadCode(pathname: string) {
      // preload just the code for a route, without storing the result
      const matches = matchRoutes(
        routes as unknown as RRRouteConfig[],
        pathname
      ) as unknown as MatchedRoute<{}, RouteConfig>[];
      matches.forEach(({ route }) => route.element?.load());
    },
    preload(pathname: string) {
      // preload the code and data for a route, without storing the result
      const matches = matchRoutes(
        routes as unknown as RRRouteConfig[],
        pathname
      ) as unknown as MatchedRoute<{}, RouteConfig>[];
      prepareMatches(matches);
    },
    subscribe(cb: Subscriber) {
      const id = nextId++;
      const dispose = () => {
        subscribers.delete(id);
      };
      subscribers.set(id, cb);
      return dispose;
    },
  };

  // Return both the context object and a cleanup function
  return { cleanup, context };
};

/**
 * Match the current location to the corresponding route entry.
 */
function matchRoute(routes: RouteConfig[], location: Location) {
  const matchedRoutes = matchRoutes(
    routes as unknown as RRRouteConfig[],
    location.pathname
  ) as unknown as MatchedRoute<{}, RouteConfig>[];
  if (!Array.isArray(matchedRoutes) || matchedRoutes.length === 0) {
    throw new Error("No route for " + location.pathname);
  }
  return matchedRoutes;
}

/**
 * Load the data for the matched route, given the params extracted from the route
 */
function prepareMatches(matches: MatchedRoute<{}, RouteConfig>[]) {
  return matches.map((match) => {
    const { route, match: matchData } = match;
    const prepared = route.prepare?.(matchData.params);
    const Component = route.element?.get();
    if (Component == null) {
      route.element?.load(); // eagerly load
    }
    return { element: route.element, prepared, routeData: matchData };
  });
}