'use client'

import { useEffect, useState, useCallback } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const totalHeight = document.body.scrollHeight - window.innerHeight
    const windowScrollTop = window.scrollY

    if (windowScrollTop === 0) {
      setProgress(0)
    } else if (windowScrollTop > totalHeight) {
      setProgress(100)
    } else {
      setProgress((windowScrollTop / totalHeight) * 100)
    }
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // Initial call
    handleScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [handleScroll])

  if (progress === 0) return null

  return (
    <div
      className="bg-primary-600 dark:bg-primary-400 fixed top-0 left-0 z-50 h-1 transition-all duration-150 ease-out"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  )
}
