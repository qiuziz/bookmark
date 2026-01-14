import { useState, useCallback, useEffect } from 'react'
import { UseResponsiveReturn } from '../types'

export function useResponsive(): UseResponsiveReturn {
  // 初始列数根据屏幕宽度设置
  const initialColumns = window.innerWidth < 600 ? 3 : window.innerWidth < 900 ? 4 : window.innerWidth < 1200 ? 5 : 6;
  const [columns, setColumns] = useState<number>(initialColumns)
  const [isMobile, setIsMobile] = useState<boolean>(false)

  const updateLayout = useCallback((): void => {
    const width = window.innerWidth
    if (width < 600) {
      setColumns(3)
      setIsMobile(true)
    } else if (width < 900) {
      setColumns(4)
      setIsMobile(false)
    } else if (width < 1200) {
      setColumns(5)
      setIsMobile(false)
    } else {
      setColumns(6)
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
