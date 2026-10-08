import { useEffect, useState } from "react";
import { api } from "@/APIs/Axios";
export default function useGradingSystem() {
  const [gradingSystem, setGradingSystem] = useState("flexible");
  useEffect(() => { let mounted = true; api.get("/schools/me/settings").then(({data}) => {
    const settings = data?.data?.settings ?? data?.data ?? data?.settings ?? data;
    if (mounted) setGradingSystem(settings?.gradingSystem === "ministry" ? "ministry" : "flexible");
  }).catch(() => {}).finally(() => {}); return () => { mounted = false; }; }, []);
  return gradingSystem;
}
