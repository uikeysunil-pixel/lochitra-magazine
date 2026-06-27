'use client'

import { useState, useRef } from 'react'

const Pre = ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
  const textInput = useRef<HTMLPreElement>(null)
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  const onEnter = () => setHovered(true)
  const onLeave = () => {
    setHovered(false)
    setCopied(false)
  }

  const onCopy = () => {
    setCopied(true)
    if (textInput.current?.textContent) {
      navigator.clipboard.writeText(textInput.current.textContent)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  return (
    <div
      className="relative my-6 overflow-hidden rounded-xl bg-gray-900 shadow-lg dark:bg-gray-800/80"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="absolute top-2 right-2 z-10">
        <button
          aria-label="Copy code"
          type="button"
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
            copied
              ? 'border border-green-500/30 bg-green-500/20 text-green-400'
              : 'border border-gray-600/50 bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
          } ${hovered || copied ? 'opacity-100' : 'opacity-0 focus:opacity-100'}`}
          onClick={onCopy}
        >
          {copied ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied ✓
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </span>
          )}
        </button>
      </div>
      <pre ref={textInput} className="overflow-x-auto p-4 pt-10 text-sm leading-relaxed" {...props}>
        {children}
      </pre>
    </div>
  )
}

export default Pre
