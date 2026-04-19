import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initGA, trackPageView } from "../../utils/analytics";

/**
 * RouteTracker
 * Listens to React Router changes and fires GA page_view events.
 */
const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    // Send pageview on route change
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null; // Component does not render anything
};

export default RouteTracker;
