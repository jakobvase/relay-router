import { BrowserHistoryOptions, createBrowserHistory, Location } from "history";
import { match, MatchedRoute, matchRoutes, RouteConfig } from "./matchRoutes";

type Subscriber = (nextEntry: {
  location: Location;
  entries: {
    element: React.JSXElementConstructor<any> | undefined;
    prepared: any;
    routeData: match;
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
  const initialMatches = matchRoute(routes, history.location);
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
    const matches = matchRoute(routes, location);
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
    preload(pathname: string) {
      // preload the data for a route, without storing the result
      const matches = matchRoutes(routes, pathname);
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
  const matchedRoutes = matchRoutes(routes, location.pathname);
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
    return { element: route.element, prepared, routeData: matchData };
  });
}
