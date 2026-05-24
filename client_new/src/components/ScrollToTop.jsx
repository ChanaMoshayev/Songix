import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** גלילה לראש הדף בכל מעבר בין נתיבים */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
