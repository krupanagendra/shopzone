/**
 * GA4 Analytics Implementation
 * Handles initialization, page views, and custom events.
 * Safely ignores actions if GA is not configured or in dev mode (optional).
 */

const GA_ID = import.meta.env.VITE_GA_ID; // Vite uses VITE_ prefix

// Initialize GA4 only once
export const initGA = () => {
  if (!GA_ID) {
    console.warn("GA4 ID missing: Analytics will not run.");
    return;
  }
  if (window.gtag) return; // Prevent duplicate initialization

  // Load the GA4 script safely without blocking rendering
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());

  // Config call with send_page_view: false so we control it via React Router
  window.gtag("config", GA_ID, {
    send_page_view: false, 
  });
};

// Track Page Views
export const trackPageView = (path) => {
  if (!GA_ID || !window.gtag) return;
  
  // Exclude Admin Routes
  if (path.startsWith("/admin")) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

// Track Custom Events
export const trackEvent = (eventName, params = {}) => {
  if (!GA_ID || !window.gtag) return;

  // Exclude admin activity if admin is accidentally on a public route triggering events
  // Assuming path checks suffice, but we can also double check current pathname
  if (window.location.pathname.startsWith("/admin")) return;

  // Filter out any sensitive keys from params just in case
  const safeParams = { ...params };
  delete safeParams.password;
  delete safeParams.email;
  delete safeParams.token;
  delete safeParams.credit_card;

  window.gtag("event", eventName, safeParams);
};
