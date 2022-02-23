import { Location, History } from "history";
import { Resource } from "JSResource";
import { Key, pathToRegexp } from "path-to-regexp";
import React from "react";

export interface StaticContext {
  statusCode?: number | undefined;
}

// export interface RouteComponentProps<
//   Params extends { [K in keyof Params]?: string } = {},
//   C extends StaticContext = StaticContext,
//   S = H.LocationState
// > {
//   history: H.History<S>;
//   location: H.Location<S>;
//   match: match<Params>;
//   staticContext?: C | undefined;
// }

export interface RouteComponentProps<
  Params extends { [K in keyof Params]?: string } = {},
  C extends StaticContext = StaticContext
> {
  history: History;
  location: Location;
  match: match<Params>;
  staticContext?: C | undefined;
}

export interface match<Params extends { [K in keyof Params]?: string } = {}> {
  params: Params;
  isExact: boolean;
  path: string;
  url: string;
}

export interface RouteConfigComponentProps<
  Params extends { [K in keyof Params]?: string } = {}
> extends RouteComponentProps<Params> {
  route?: RouteConfig | undefined;
}

export interface RouteConfig {
  key?: React.Key | undefined;
  location?: Location | undefined;
  element?: Resource<React.ReactNode>;
  path?: string | string[] | undefined;
  exact?: boolean | undefined;
  strict?: boolean | undefined;
  routes?: RouteConfig[] | undefined;
  render?:
    | ((props: RouteConfigComponentProps<any>) => React.ReactNode)
    | undefined;
  prepare?: (params?: any /* url params object */) => any; //PreloadedQuery;
  [propName: string]: any;
}

export interface MatchedRoute<
  Params extends { [K in keyof Params]?: string },
  TRouteConfig extends RouteConfig = RouteConfig
> {
  route: TRouteConfig;
  match: match<Params>;
}

export interface RouteChildrenProps<
  Params extends { [K in keyof Params]?: string } = {}
> {
  history: History;
  location: Location;
  match: match<Params> | null;
}

export type ExtractRouteOptionalParam<
  T extends string,
  U = string | number | boolean
> = T extends `${infer Param}?`
  ? { [k in Param]?: U }
  : T extends `${infer Param}*`
  ? { [k in Param]?: U }
  : T extends `${infer Param}+`
  ? { [k in Param]: U }
  : { [k in T]: U };

export type ExtractRouteParams<
  T extends string,
  U = string | number | boolean
> = string extends T
  ? { [k in string]?: U }
  : T extends `${infer _Start}:${infer ParamWithOptionalRegExp}/${infer Rest}`
  ? ParamWithOptionalRegExp extends `${infer Param}(${infer _RegExp})`
    ? ExtractRouteOptionalParam<Param, U> & ExtractRouteParams<Rest, U>
    : ExtractRouteOptionalParam<ParamWithOptionalRegExp, U> &
        ExtractRouteParams<Rest, U>
  : T extends `${infer _Start}:${infer ParamWithOptionalRegExp}`
  ? ParamWithOptionalRegExp extends `${infer Param}(${infer _RegExp})`
    ? ExtractRouteOptionalParam<Param, U>
    : ExtractRouteOptionalParam<ParamWithOptionalRegExp, U>
  : {};

export interface RouteProps<
  Path extends string = string,
  Params extends { [K: string]: string | undefined } = ExtractRouteParams<
    Path,
    string
  >
> {
  location?: Location | undefined;
  component?:
    | React.ComponentType<RouteComponentProps<any>>
    | React.ComponentType<any>
    | undefined;
  render?:
    | ((props: RouteComponentProps<Params>) => React.ReactNode)
    | undefined;
  children?:
    | ((props: RouteChildrenProps<Params>) => React.ReactNode)
    | React.ReactNode
    | undefined;
  path?: Path | readonly Path[] | undefined;
  exact?: boolean | undefined;
  sensitive?: boolean | undefined;
  strict?: boolean | undefined;
}

const cache = {} as Record<
  string,
  Record<string, { regexp: RegExp; keys: Key[] }>
>;
const cacheLimit = 10000;
let cacheCount = 0;

const compilePath = (
  path: string,
  options: { end: boolean; strict: boolean; sensitive: boolean }
): { regexp: RegExp; keys: Key[] } => {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

  if (pathCache[path]) return pathCache[path];

  const keys = [] as Key[];
  const regexp = pathToRegexp(path, keys, options);
  const result = { regexp, keys };

  if (cacheCount < cacheLimit) {
    pathCache[path] = result;
    cacheCount++;
  }

  return result;
};

/**
 * Public API for matching a URL pathname to a path.
 */
const matchPath = <Params extends { [K in keyof Params]?: string }>(
  pathname: string,
  options: string | string[] | RouteProps = {}
): match<Params> | null => {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { path: options };
  }

  const { path, exact = false, strict = false, sensitive = false } = options;

  const paths = ([] as string[]).concat(path!);

  return paths.reduce((matched, path) => {
    if (!path && path !== "") return null;
    if (matched) return matched;

    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict,
      sensitive,
    });
    const match = regexp.exec(pathname);

    if (!match) return null;

    const [url, ...values] = match;
    const isExact = pathname === url;

    if (exact && !isExact) return null;

    return {
      path, // the path used to match
      url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo, key, index) => {
        (memo as any)[key.name] = values[index];
        return memo;
      }, {} as Params),
    };
  }, null as match<Params> | null);
};

const computeRootMatch = <Params extends { [K in keyof Params]?: string }>(
  pathname: string
) => {
  return {
    path: "/",
    url: "/",
    params: {} as Params,
    isExact: pathname === "/",
  };
};

export const matchRoutes = <
  Params extends { [K in keyof Params]?: string },
  TRouteConfig extends RouteConfig = RouteConfig
>(
  routes: TRouteConfig[],
  pathname: string,
  /*not public API*/ branch: {
    route: TRouteConfig;
    match: match<Params>;
  }[] = []
): Array<MatchedRoute<Params, TRouteConfig>> => {
  routes.some((route) => {
    const match = route.path
      ? matchPath<Params>(pathname, route)
      : branch.length
      ? branch[branch.length - 1].match // use parent match
      : computeRootMatch<Params>(pathname); // use default "root" match

    if (match) {
      branch.push({ route, match });

      if (route.routes) {
        matchRoutes(route.routes, pathname, branch);
      }
    }

    return match;
  });

  return branch;
};
