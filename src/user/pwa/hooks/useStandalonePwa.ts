import { useEffect, useState } from "react";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const detectStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true ||
    document.referrer.startsWith("android-app://")
  );
};

export function useStandalonePwa() {
  const [standalone, setStandalone] = useState(detectStandalone);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const update = () => setStandalone(detectStandalone());
    update();
    displayMode.addEventListener?.("change", update);
    return () => displayMode.removeEventListener?.("change", update);
  }, []);

  return standalone;
}
