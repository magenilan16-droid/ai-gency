"use client";
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:9999, background:"#1f2937", color:"white", textAlign:"center", padding:"10px 16px", fontSize:"13px", fontWeight:"bold" }}>
      📡 You're offline — viewing cached content
    </div>
  );
}
