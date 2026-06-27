'use client'

import { useState, useEffect, useRef } from 'react'

interface TocItem {
  value: string
  url: string
  depth: number
}

interface TableOfContentsProps {
  toc: TocItem[]
}

// ─── Shared active-heading hook ──────────────────────────────────────────────

function useActiveHeading(filteredToc: TocItem[]) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (filteredToc.length === 0) return

    const headingIds = filteredToc.map((item) => item.url.replace('#', ''))

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -55% 0px',
        threshold: 0,
      }
    )

    headingIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredToc.length])

  return activeId
}

// ─── Shared smooth-scroll handler ────────────────────────────────────────────

function scrollToHeading(url: string) {
  const id = url.replace('#', '')
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

// ─── Shared list renderer — H2s only ─────────────────────────────────────────

interface TocListProps {
  items: TocItem[]
  activeId: string
  onItemClick?: () => void
}

function TocList({ items, activeId, onItemClick }: TocListProps) {
  return (
    <nav aria-label="Table of contents">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const id = item.url.replace('#', '')
          const isActive = activeId === id
          const indentClass = item.depth === 3 ? 'ml-4' : item.depth === 4 ? 'ml-8' : ''
          return (
            <li key={item.url} className={indentClass}>
              <button
                onClick={() => {
                  scrollToHeading(item.url)
                  onItemClick?.()
                }}
                className={`w-full py-1 text-left text-[13px] leading-snug transition-all duration-150 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 font-semibold'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isActive && (
                    <span
                      className="bg-primary-500 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  <span className={isActive ? '' : 'ml-3.5'}>{item.value}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ─── Mobile TOC — H2s only, accordion, hidden on lg+ ────────────────────────

/**
 * Default export — mobile collapsible TOC (lg:hidden on root).
 * Only shows H2 headings (depth === 2).
 */
export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // H2s and H3s
  const filteredToc = toc.filter((item) => item.depth >= 2 && item.depth <= 3)
  const activeId = useActiveHeading(filteredToc)

  if (filteredToc.length < 2) return null

  return (
    <div className="mb-8 lg:hidden" role="navigation" aria-label="Article table of contents">
      <button
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        aria-controls="mobile-toc-panel"
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200"
      >
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h10"
            />
          </svg>
          On This Page
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          id="mobile-toc-panel"
          className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <TocList
            items={filteredToc}
            activeId={activeId}
            onItemClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Desktop TOC — H2s only, sticky sidebar, shown only on lg+ ───────────────

/**
 * Named export — desktop sticky sidebar TOC.
 * Only shows H2 headings (depth === 2) for a compact, scannable list.
 * Sticky within the sidebar column; no mobile markup at all.
 */
export function DesktopToc({ toc }: TableOfContentsProps) {
  // H2s and H3s
  const filteredToc = toc.filter((item) => item.depth >= 2 && item.depth <= 3)
  const activeId = useActiveHeading(filteredToc)

  if (filteredToc.length < 2) return null

  return (
    <div
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
      role="navigation"
      aria-label="Article table of contents sidebar"
    >
      <p className="mb-3 text-[10px] font-bold tracking-[0.12em] text-gray-400 uppercase dark:text-gray-500">
        On This Page
      </p>
      <div className="border-l-2 border-gray-100 pl-4 dark:border-gray-800">
        <TocList items={filteredToc} activeId={activeId} />
      </div>
    </div>
  )
}
