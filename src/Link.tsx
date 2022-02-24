import RoutingContext from "./RoutingContext";
import { useCallback, useContext } from "react";

/**
 * An alternative to react-router's Link component that works with
 * our custom RoutingContext.
 */
export const Link = (props: { to: string; children: React.ReactNode }) => {
  const router = useContext(RoutingContext);

  // When the user clicks, change route
  const changeRoute = useCallback(
    (event) => {
      event.preventDefault();
      router.history.push(props.to);
    },
    [props.to, router]
  );

  // Callback to preload the data for the route:
  // we pass this to onMouseDown, since this is a stronger
  // signal that the user will likely complete the navigation
  const preloadRoute = useCallback(() => {
    router.preload(props.to);
  }, [props.to, router]);

  return (
    <a href={props.to} onClick={changeRoute} onMouseDown={preloadRoute}>
      {props.children}
    </a>
  );
};
