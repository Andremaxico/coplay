'use client'

import { useEffect } from 'react'

export function HeaderHeightResolver() {
  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('header')
      if (header) {
        const height = header.getBoundingClientRect().height
        document.documentElement.style.setProperty('--header-height', `${height}px`)
      }
    }

    // Run on mount
    updateHeight()

    // Run on resize
    window.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return null
}
