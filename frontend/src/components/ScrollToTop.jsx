import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop
 * Resets the scroll position of `scrollRef` (and window) to the top
 * whenever the URL pathname changes.
 *
 * @param {{ scrollRef: React.RefObject }} props
 */
function ScrollToTop({ scrollRef }) {
    const { pathname } = useLocation()

    useEffect(() => {
        // Reset the main content area scroll
        if (scrollRef?.current) {
            scrollRef.current.scrollTop = 0
        }
        // Also reset window scroll as a fallback
        window.scrollTo(0, 0)
    }, [pathname, scrollRef])

    return null
}

export default ScrollToTop
