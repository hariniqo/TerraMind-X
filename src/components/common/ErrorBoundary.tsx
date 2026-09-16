import logger from '../../utils/logger'
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  moduleName?: string
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error(`[ErrorBoundary - ${this.props.moduleName || 'App'}]:`, error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const moduleName = this.props.moduleName || 'Agricultural Module'

      return (
        <div className="p-6 sm:p-8 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 text-center my-6 max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#12161A] dark:text-white tracking-tight">
              {moduleName} Temporarily Unavailable
            </h3>
            <p className="text-xs text-[#6C747C] dark:text-[#9AA3AB] mt-1 max-w-md mx-auto leading-relaxed">
              An unexpected render issue occurred while loading this intelligence component. You can reload this module safely without losing your session.
            </p>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <div className="p-3 rounded-xl bg-black/40 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-32">
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-2xl bg-[#5BB983] hover:bg-[#4ea874] text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-[#5BB983]/20"
            >
              <RefreshCw className="w-4 h-4" /> Reload Module
            </button>
            <a
              href="/"
              className="px-4 py-2.5 rounded-2xl bg-[#F3F1EA] dark:bg-[#242B32] hover:bg-[#5BB983]/10 text-[#12161A] dark:text-white text-xs font-bold transition border border-[#323A42]/15 dark:border-[#323A42] flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" /> Home
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
