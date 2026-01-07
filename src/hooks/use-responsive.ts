import { useState, useCallback, useEffect } from 'react'
import { UseResponsiveReturn } from '../types'

export function useResponsive(): UseResponsiveReturn {
  const [columns, setColumns] = useState<number>(4)
  const [isMobile, setIsMobile] = useState<boolean>(false)

  const updateLayout = useCallback((): void => {
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

  useEffect((): (() => void) => {
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return (): void => window.removeEventListener('resize', updateLayout)
  }, [updateLayout])

  return { columns, isMobile }
}
