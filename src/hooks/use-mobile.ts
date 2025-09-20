import * as React from "react"
import { useIsMobile as useIsMobileResponsive } from "@/lib/responsive"

const MOBILE_BREAKPOINT = 768

// Legacy hook for backward compatibility
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Recommended hook using new responsive utilities
export const useIsMobileNew = useIsMobileResponsive;
