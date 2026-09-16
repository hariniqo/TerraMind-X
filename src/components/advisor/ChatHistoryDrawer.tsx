import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Clock, Search, X, Trash2, ArrowRight } from 'lucide-react'

export interface ChatSession {
  id: string
  title: string
  date: string
  preview: string
  crop: string
}

interface Props {
  isOpen: boolean
  sessions: ChatSession[]
  onSelectSession: (session: ChatSession) => void
  onClose: () => void
}

export const ChatHistoryDrawer: React.FC<Props> = ({
  isOpen,
  sessions,
  onSelectSession,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const filtered = sessions.filter(
    s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-sm bg-white dark:bg-[#0c1f17] border-l border-terra-200 dark:border-emerald-500/20 h-full p-6 shadow-2xl flex flex-col space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-terra-100 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-extrabold text-terra-950 dark:text-white">Advisory History</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-terra-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-terra-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous farm advisories..."
              className="w-full bg-terra-50 dark:bg-black/30 border border-terra-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-terra-950 dark:text-white font-medium"
            />
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectSession(s)
                  onClose()
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-terra-50 dark:bg-white/[0.02] border border-terra-100 dark:border-white/5 hover:border-emerald-500/30 transition space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-terra-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {s.title}
                  </span>
                  <span className="text-[10px] font-mono text-terra-400">{s.date}</span>
                </div>
                <p className="text-[11px] text-terra-500 dark:text-terra-400 line-clamp-2">
                  {s.preview}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold">
                    {s.crop}
                  </span>
                  <ArrowRight className="w-3 h-3 text-terra-400 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
