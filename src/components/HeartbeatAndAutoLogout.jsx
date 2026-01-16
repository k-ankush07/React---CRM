import { useEffect } from "react";
import { api } from "../lib/api";

export default function LogoutOnTabClose() {
  useEffect(() => {
    const SESSION_KEY = "pageLoadTime";
    const THRESHOLD = 1000; 
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());

    const handleUnload = () => {
      const loadTime = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
      const now = Date.now();
      const timeDiff = now - loadTime;
      setTimeout(() => {
        if (timeDiff < THRESHOLD) {
          localStorage.setItem("lastRefresh", new Date().toISOString());
        } else {
          const url = api.auth.logout.path;

          if (navigator.sendBeacon) {
            navigator.sendBeacon(url);
          } else {
            fetch(url, {
              method: api.auth.logout.method || "POST",
              credentials: "include",
              keepalive: true,
            });
          }
          localStorage.setItem("lastLogout", new Date().toISOString());
        }
      }, 0);
    };

    window.addEventListener("unload", handleUnload);
    return () => {
      window.removeEventListener("unload", handleUnload);
    };
  }, []);

  return null;
}