import { useEffect } from "react";

const BASE_URL = "http://localhost:5000";

export default function SessionTracker() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${BASE_URL}/api/heartbeat`, {
        method: "POST",
        credentials: "include",
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon(
        `${BASE_URL}/api/possible-close`,
        JSON.stringify({ reason: "tab_or_browser_close" })
      );
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return null;
}
