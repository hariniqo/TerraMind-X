import { useEffect, useState, useRef } from 'react'
import { 
  Sprout, 
  HelpCircle, 
  CornerDownLeft, 
  Mic, 
  Volume2, 
  VolumeX, 
  Clock, 
  Database, 
  ShieldCheck, 
  AlertTriangle,
  Lightbulb,
  Bot
} from 'lucide-react'
import { sendAIChatMessage } from '../../api/councilApi'
import { Badge } from '../ui/Badge'

type Message = { 
  id: string; 
  from: 'user' | 'ai'; 
  text: string;
  structured?: {
    recommendation?: string;
    why?: string[];
    watch?: string;
    action?: string;
    confidence?: string;
    source?: string;
    timestamp?: string;
  }
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chatLanguage, setChatLanguage] = useState<'en' | 'ta' | 'tanglish'>('en')
  const [isListening, setIsListening] = useState(false)
  const [speakMessageId, setSpeakMessageId] = useState<string | null>(null)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Welcome message based on language selection
    const welcomeText = chatLanguage === 'ta' 
      ? 'வணக்கம்! நான் டெராமைண்ட் AI ஆலோசகர். உங்கள் வயல் மண் விவரங்களை ஆராய்ந்து முடித்துள்ளேன். தற்போதைய பருவ சாகுபடி, மண் வள மேலாண்மை அல்லது சந்தை விலைகள் பற்றி என்னிடம் கேளுங்கள்.'
      : chatLanguage === 'tanglish'
      ? 'Hello! Naan TerraMind AI Advisor. Unga farm parameters details analyze panniten. Enna crop sowed panalam, fertilizer remedies, or prices pathi ennakita kelunga.'
      : 'Hello! I am TerraMind AI Advisor. I have analyzed your farm soil, moisture, and local weather forecasts. Ask me anything about crop choices, fertilizer remedies, or price trends.';

    setMessages([
      { 
        id: 'm1', 
        from: 'ai', 
        text: welcomeText,
        structured: {
          recommendation: chatLanguage === 'ta' ? 'நிலக்கடலை சாகுபடி செய்ய பரிந்துரைக்கப்படுகிறது.' : 'Sow Groundnut under dryland conditions.',
          why: chatLanguage === 'ta' 
            ? ['செம்மண் pH 6.7 காரத்தன்மைக்கு உகந்தது', 'நீர் தேவை குறைவு'] 
            : ['Optimal Red Loam pH 6.7 match', 'Conserves groundwater draft'],
          watch: chatLanguage === 'ta' ? 'அடுத்த வார மழைப்பொழிவு' : 'Flowering stage moisture stress',
          action: chatLanguage === 'ta' ? '1.5 டன் மண்புழு உரம் இடவும்' : 'Apply Vermicompost before seed drilling',
          confidence: '91%',
          source: 'FastAPI AI Council Gateway',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }
    ])
  }, [chatLanguage])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Custom parser to format raw AI responses into structures
  const parseAIResponse = (rawText: string): any => {
    const lines = rawText.split('\n')
    let recommendation = ''
    const why: string[] = []
    let watch = ''
    let action = ''
    
    let mode: 'none' | 'why' | 'watch' | 'action' | 'rec' = 'none'

    for (let line of lines) {
      line = line.trim()
      if (!line) continue

      const lowerLine = line.toLowerCase()
      if (lowerLine.includes('recommendation:') || lowerLine.includes('பரிந்துரை:') || lowerLine.startsWith('🌱')) {
        recommendation = line.replace(/🌱|recommendation:|பரிந்துரை:/gi, '').trim()
        mode = 'rec'
      } else if (lowerLine.includes('why?') || lowerLine.includes('ஏன்?')) {
        mode = 'why'
      } else if (lowerLine.includes('watch') || lowerLine.includes('கவனிப்பு:')) {
        mode = 'watch'
      } else if (lowerLine.includes('action') || lowerLine.includes('செயல்பாடு:')) {
        mode = 'action'
      } else {
        if (mode === 'why') {
          why.push(line.replace(/^[•\-\*]\s*/, ''))
        } else if (mode === 'watch') {
          watch += (watch ? ' ' : '') + line.replace(/^[•\-\*]\s*/, '')
        } else if (mode === 'action') {
          action += (action ? ' ' : '') + line.replace(/^[•\-\*]\s*/, '')
        } else if (mode === 'rec') {
          recommendation += ' ' + line
        }
      }
    }

    // Do not invent evidence when the backend response is unstructured.
    if (!recommendation) recommendation = rawText.trim() || 'Recommendation unavailable.'

    return {
      recommendation,
      why,
      watch,
      action,
          confidence: 'Unavailable',
          source: 'Backend evidence unavailable',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const triggerVoiceSim = () => {
    setIsListening(true)
    setTimeout(() => {
      setIsListening(false)
      const prompt = chatLanguage === 'ta' 
        ? 'இந்த பருவத்தில் நான் என்ன பயிர் செய்ய வேண்டும்?' 
        : 'Which crop should I plant this season?';
      setText(prompt)
    }, 2000)
  }

  const send = async (queryText: string) => {
    if (!queryText.trim()) return
    const userMsg: Message = { id: Date.now().toString(), from: 'user', text: queryText }
    setMessages((s) => [...s, userMsg])
    setText('')
    setIsTyping(true)

    try {
      const res = await sendAIChatMessage({
        query: queryText,
        language: chatLanguage === 'tanglish' ? 'en' : chatLanguage,
      })
      setIsTyping(false)
      
      const replyText = res?.response || 'The advisor returned no response.'

      const structuredObj = parseAIResponse(replyText)

      setMessages((s) => [
        ...s, 
        { 
          id: `${Date.now()}-ai`, 
          from: 'ai', 
          text: replyText,
          structured: structuredObj
        }
      ])
    } catch (e) {
      setIsTyping(false)
      const fallbackText = "Failed to connect to AI Advisor service."
      setMessages((s) => [
        ...s, 
        { 
          id: `${Date.now()}-ai`, 
          from: 'ai', 
          text: fallbackText
        }
      ])
    }
  }

  const toggleSpeech = (id: string, phrase: string) => {
    if (speakMessageId === id) {
      setSpeakMessageId(null)
      window.speechSynthesis.cancel()
    } else {
      setSpeakMessageId(id)
      const speech = new SpeechSynthesisUtterance(phrase)
      speech.lang = chatLanguage === 'ta' ? 'ta-IN' : 'en-IN'
      speech.onend = () => setSpeakMessageId(null)
      window.speechSynthesis.speak(speech)
    }
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#0f1915] rounded-[28px] overflow-hidden border border-terra-200 dark:border-white/5 shadow-sm">
      
      {/* Top Header controls */}
      <div className="p-4 bg-terra-50 dark:bg-deep-green border-b border-terra-200 dark:border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-tamil-gold" />
          <span className="text-xs font-extrabold text-terra-950 dark:text-white uppercase tracking-wider">Advisor Agent</span>
        </div>
        
        {/* Language Toggles */}
        <div className="flex bg-terra-100 dark:bg-forest p-0.5 rounded-lg border border-terra-200 dark:border-white/10">
          {(['en', 'ta', 'tanglish'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setChatLanguage(lang)}
              className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition ${
                chatLanguage === lang 
                  ? 'bg-white dark:bg-white/10 text-terra-950 dark:text-white shadow-sm' 
                  : 'text-terra-600 dark:text-highlight-cream/65 hover:text-white'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 max-h-[300px]">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.from === 'ai' ? 'items-start' : 'items-end'}`}>
            
            {/* User message */}
            {m.from === 'user' && (
              <div className="p-3.5 rounded-[22px] rounded-tr-sm bg-terra-700 text-white max-w-[85%] text-xs font-bold shadow-sm">
                {m.text}
              </div>
            )}

            {/* AI message */}
            {m.from === 'ai' && (
              <div className="space-y-3 w-full max-w-[90%]">
                
                {/* Structured Display Box */}
                {m.structured ? (
                  <div className="bg-terra-50 dark:bg-[#152e1d]/40 rounded-3xl border border-terra-200 dark:border-paddy-green/20 p-5 space-y-4 shadow-sm text-xs text-terra-850 dark:text-highlight-cream">
                    
                    {/* Directive */}
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-paddy-green font-extrabold">🌱 AI Recommendation</span>
                      <p className="font-extrabold text-terra-950 dark:text-white text-sm leading-relaxed">
                        {m.structured.recommendation}
                      </p>
                    </div>

                    {/* Why bullet list */}
                    {m.structured.why && m.structured.why.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-tamil-gold font-extrabold">Why?</span>
                        <ul className="space-y-1 font-semibold">
                          {m.structured.why.map((r, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-tamil-gold" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Watch alert */}
                    {m.structured.watch && (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-red-500 font-extrabold">⚠️ Watch</span>
                        <p className="font-semibold">{m.structured.watch}</p>
                      </div>
                    )}

                    {/* Action directive */}
                    {m.structured.action && (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-blue-500 font-extrabold">💧 Action</span>
                        <p className="font-semibold">{m.structured.action}</p>
                      </div>
                    )}

                    {/* Bottom Metadata */}
                    <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-terra-450 dark:text-highlight-cream/30 pt-3 border-t border-terra-100 dark:border-white/5 font-extrabold">
                      <span className="flex items-center gap-1"><Database className="w-3 h-3 text-tamil-gold" /> {m.structured.source}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-tamil-gold" /> {m.structured.timestamp}</span>
                      <span className="text-paddy-green">{m.structured.confidence} Match</span>
                    </div>

                  </div>
                ) : (
                  // Plain raw block format
                  <div className="p-4 rounded-[22px] rounded-tl-sm bg-terra-50 text-terra-950 dark:bg-neutral-800 dark:text-terra-200 text-xs font-semibold leading-relaxed shadow-sm">
                    {m.text}
                  </div>
                )}

                {/* Speech read-out buttons */}
                <div className="flex gap-2 pl-2">
                  <button 
                    onClick={() => toggleSpeech(m.id, m.structured?.recommendation || m.text)}
                    className="p-1.5 bg-terra-100 hover:bg-terra-200 dark:bg-white/5 dark:hover:bg-white/10 border border-terra-200 dark:border-white/10 rounded-lg text-terra-600 dark:text-white transition flex items-center justify-center"
                    title="Speak Answer"
                  >
                    {speakMessageId === m.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="p-3 bg-terra-50 text-terra-600 rounded-[20px] text-xs font-bold animate-pulse dark:bg-neutral-800 dark:text-terra-300">
              TerraMind-X is compiling recommendation details...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested quick chips */}
      <div className="p-3 border-t border-terra-100 dark:border-white/5 bg-terra-50/50 dark:bg-deep-green/30 flex flex-wrap gap-2">
        {[
          chatLanguage === 'ta' ? "நான் என்ன பயிரிட வேண்டும்?" : "What should I grow?",
          chatLanguage === 'ta' ? "எப்போது விற்க வேண்டும்?" : "When should I sell?",
          chatLanguage === 'ta' ? "எங்கே விற்க வேண்டும்?" : "Where should I sell?",
          chatLanguage === 'ta' ? "சந்தை ஆபத்தை சரிபார்க்கவும்" : "Check market risk",
          chatLanguage === 'ta' ? "என் மண்ணை சரிபார்க்கவும்" : "Check my soil",
          chatLanguage === 'ta' ? "பயிர்களை ஒப்பிடவும்" : "Compare crops"
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => send(prompt)}
            className="px-3 py-1.5 rounded-full border border-terra-200 bg-white hover:bg-terra-50 dark:bg-forest dark:border-white/10 text-[10px] font-extrabold text-terra-700 dark:text-terra-300 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Inputs bar */}
      <div className="p-3 border-t border-terra-100 dark:border-white/5 flex gap-2">
        <button
          onClick={triggerVoiceSim}
          className={`p-3 rounded-2xl border transition flex items-center justify-center ${
            isListening 
              ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' 
              : 'bg-terra-50 hover:bg-terra-100 dark:bg-neutral-900 border-terra-200 dark:border-white/10 text-terra-700 dark:text-white'
          }`}
          title="Simulate Voice Input"
        >
          <Mic className="h-4.5 w-4.5" />
        </button>

        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && send(text)}
          placeholder={isListening ? "Listening..." : "Ask TerraMind..."} 
          className="flex-1 rounded-2xl border border-terra-200 dark:border-white/10 px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-terra-400 bg-terra-50/50 dark:bg-neutral-900 dark:text-white" 
        />
        <button 
          onClick={() => send(text)} 
          className="rounded-2xl bg-terra-700 hover:bg-terra-800 px-5 py-3 text-xs text-white font-bold transition flex items-center gap-1.5"
        >
          <span>Send</span>
          <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default AIChat
