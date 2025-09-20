// Responsive design utilities and hooks for Shiv Accounts Cloud

import { useEffect, useState } from "react";

// Breakpoint values matching Tailwind CSS defaults
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Hook to detect current screen size
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    
    return () => media.removeEventListener("change", listener);
  }, [matches, breakpoint]);

  return matches;
}

// Hook to get current screen size category
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<Breakpoint | "xs">("xs");

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints["2xl"]) {
        setScreenSize("2xl");
      } else if (width >= breakpoints.xl) {
        setScreenSize("xl");
      } else if (width >= breakpoints.lg) {
        setScreenSize("lg");
      } else if (width >= breakpoints.md) {
        setScreenSize("md");
      } else if (width >= breakpoints.sm) {
        setScreenSize("sm");
      } else {
        setScreenSize("xs");
      }
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  return screenSize;
}

// Hook to detect if user is on mobile device
export function useIsMobile(): boolean {
  return !useBreakpoint("md");
}

// Hook to detect if user is on tablet
export function useIsTablet(): boolean {
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  return isMd && !isLg;
}

// Hook to detect if user is on desktop
export function useIsDesktop(): boolean {
  return useBreakpoint("lg");
}

// Utility function to get responsive classes
export function getResponsiveClasses(config: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
}): string {
  const classes = [];
  
  if (config.base) classes.push(config.base);
  if (config.sm) classes.push(`sm:${config.sm}`);
  if (config.md) classes.push(`md:${config.md}`);
  if (config.lg) classes.push(`lg:${config.lg}`);
  if (config.xl) classes.push(`xl:${config.xl}`);
  if (config["2xl"]) classes.push(`2xl:${config["2xl"]}`);
  
  return classes.join(" ");
}

// Common responsive grid configurations
export const responsiveGrids = {
  dashboard: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  cards: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  features: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  stats: "grid-cols-2 md:grid-cols-4",
  table: "grid-cols-1",
  form: "grid-cols-1 md:grid-cols-2",
} as const;

// Common responsive spacing
export const responsiveSpacing = {
  section: "py-8 md:py-12 lg:py-16",
  container: "px-4 sm:px-6 lg:px-8",
  gap: "gap-4 md:gap-6 lg:gap-8",
} as const;

// Common responsive text sizes
export const responsiveText = {
  hero: "text-3xl md:text-4xl lg:text-5xl xl:text-6xl",
  heading: "text-2xl md:text-3xl lg:text-4xl",
  subheading: "text-lg md:text-xl lg:text-2xl",
  body: "text-sm md:text-base",
} as const;