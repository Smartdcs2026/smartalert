(() => {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(
        "/smartalert/service-worker.js",
        { scope: "/smartalert/" }
      )
      .catch((error) => {
        console.warn(
          "SmartAlert PWA registration failed:",
          error
        );
      });
  });
})();
