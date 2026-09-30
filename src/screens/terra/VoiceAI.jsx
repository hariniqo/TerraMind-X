import { useState } from 'react'

const SUGGESTIONS = [
  'இந்த சீசனில் என்ன பயிர் நட வேண்டும்?',
  'When should I apply fertilizer?',
  'What is turmeric price today?',
  'Is heavy rain coming this week?',
  'How do I fix soil phosphorus?',
]

const INITIAL_CHAT = [
  { role: 'ai', text: 'வணக்கம் Arjun! நான் உங்கள் TerraMind AI உதவியாளர். உங்கள் விவசாயம் பற்றி என்ன கேட்க விரும்புகிறீர்கள்? / Hello Arjun! I\'m your TerraMind AI. How can I help your farm today?' },
  { role: 'user', text: 'When should I sow turmeric this season?' },
  { role: 'ai', text: 'Based on your farm data, the optimal sowing window is June 15 – July 5, 2025. Your soil pH 6.2 and drainage are ideal. Procure BSR-2 rhizomes from Erode by June 12. Should I add a task reminder?' },
]

export function VoiceAIScreen({ onNav }) {
  const [listening, setListening] = useState(false)
  const [chat, setChat] = useState(INITIAL_CHAT)
  const [input, setInput] = useState('')
  const [lang, setLang] = useState('en')

  function send() {
    if (!input.trim()) return
    setChat(c => [...c,
      { role: 'user', text: input },
      { role: 'ai', text: 'Based on your 4.5-acre farm in Kovilpatti, I recommend prioritizing soil phosphorus correction (apply 250 kg SSP) and procuring BSR-2 rhizomes this week before the optimal sowing window opens on June 15.' },
    ])
    setInput('')
  }

  return (
    <div className="topo h-screen flex flex-col">
      <div className="px-5 pt-12 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNav('dashboard')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div>
              <p className="font-sans text-white font-800 text-lg">Voice AI</p>
              <p className="font-sans text-white/40 text-xs">TerraMind Assistant · Multilingual</p>
            </div>
          </div>
          <div className="flex gap-1 p-1 bg-app-card rounded-xl">
            {['en','ta'].map(l => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 rounded-lg font-sans text-xs font-700 transition-colors ${lang===l ? 'bg-app-orange text-white' : 'text-white/45'}`}>{l==='en' ? 'English' : 'தமிழ்'}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role==='user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role==='ai' && <div className="w-8 h-8 rounded-full bg-app-orange flex items-center justify-center text-sm shrink-0 mt-1">🌿</div>}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role==='user' ? 'bg-app-orange text-white rounded-br-sm' : 'card-dark text-white/80 rounded-bl-sm'}`}>
              <p className="font-sans text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        <div>
          <p className="font-sans text-white/35 text-xs uppercase tracking-wider mb-2">Quick Questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.slice(0,3).map((s,i) => (
              <button key={i} onClick={() => setInput(s)} className="px-3 py-1.5 card-dark border border-white/15 rounded-full text-xs font-sans text-white/60 text-left">{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-white/[0.08]">
        <div className="flex justify-center mb-4">
          <button onClick={() => setListening(l => !l)} className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${listening ? 'bg-red-500' : 'bg-app-orange'}`}>
            {listening && <span className="absolute inset-0 rounded-full bg-app-orange animate-pulse-ring" />}
            {listening ? (
              <div className="flex items-end gap-1 h-7">
                {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 bg-white rounded-full wbar" style={{ height: `${14+i*6}px` }} />)}
              </div>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        </div>
        {listening && <p className="text-center font-mono text-xs text-white/40 mb-3">Listening... speak now</p>}
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send()} placeholder="Type a question about your farm..." className="input-dark flex-1 text-sm" />
          <button onClick={send} className="w-12 h-12 bg-app-orange rounded-xl flex items-center justify-center active:scale-95 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}