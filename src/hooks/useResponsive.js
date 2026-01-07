import { useState, useCallback, useEffect } from 'react'

export function useResponsive() {
  const [columns, setColumns] = useState(4)
  const [isMobile, setIsMobile] = useState(false)

  const updateLayout = useCallback(() => {
    const width = window.innerWidth
    if (width < 600) {
      setColumns(2)
      setIsMobile(true)
    } else if (width < 900) {
      setColumns(3)
      setIsMobile(false)
    } else {
      setColumns(4)
      setIsMobile(false)
    }
  }, [])

  useEffect(() => {
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [updateLayout])

  return { columns, isMobile }
}
