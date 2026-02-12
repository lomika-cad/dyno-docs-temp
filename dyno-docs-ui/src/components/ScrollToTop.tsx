import { type ReactNode, useEffect, useState } from "react";
import "../styles/scroll-to-top.css";

interface ScrollToTopProps {
  smooth?: boolean;
  offset?: number;
  label?: string;
  children?: ReactNode;
}

export default function ScrollToTop({
  smooth = true,
  offset = 320,
  label = "Back to top",
  children,
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > offset);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [offset]);

  const handleClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <>
      {children}
      <button
        type="button"
        className={`scroll-to-top ${isVisible ? "visible" : ""}`}
        onClick={handleClick}
        aria-label={label}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          role="presentation"
          aria-hidden="true"
        >
          <path
            d="M12 5.5l-6.5 6.5 1.41 1.41L11 9.81V19h2V9.81l4.09 3.6 1.41-1.41z"
            fill="currentColor"
          />
        </svg>
      </button>
    </>
  );
}
