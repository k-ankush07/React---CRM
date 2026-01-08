import { useEffect } from "react";
import { useUser } from "./Use-auth";

const BASE_URL = "http://localhost:5000";

export default function HeartbeatAndAutoLogout() {
    const { data: user } = useUser();

    useEffect(() => {
        if (!user) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/heartbeat`, {
                    method: "POST",
                    credentials: "include",
                });

                if (res.status === 401) {
                    window.location.href = "/login";
                }
            } catch (e) {
                console.error("Heartbeat failed", e);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [user]);


    return null;
}
