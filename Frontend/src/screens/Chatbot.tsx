import { useState, useRef, useEffect } from 'react'
import { type Screen, type Language } from '../types'
import { TerraMindAvatar, type AvatarState } from '../components/Avatar'
import { api } from '../api'

/* ── Labels by language ── */
const L: Record<Language, {
  title: string; subtitle: string; placeholder: string; thinking: string
  error: string; backendError: string; retry: string; welcome: string; sources: string
  micDenied: string; micUnsupported: string; listening: string
}> = {
  en: {
    title: 'TerraMind AI', subtitle: 'Agricultural market intelligence assistant',
    placeholder: 'Ask anything about your farm…', thinking: 'TerraMind is analyzing…',
    error: "TerraMind couldn't retrieve the information right now.", backendError: 'TerraMind is temporarily unavailable. Please try again.',
    retry: 'Retry', welcome: "Hello! I'm TerraMind. Ask me about your crop, market prices, buyers, selling time or farm decisions.",
    sources: 'Based on:', micDenied: 'Microphone permission is required for voice input.',
    micUnsupported: 'Voice input is not supported on this device.', listening: 'Listening…',
  },
  ta: {
    title: 'TerraMind AI', subtitle: 'விவசாய சந்தை தகவல் உதவியாளர்',
    placeholder: 'உங்கள் பண்ணை பற்றி கேளுங்கள்…', thinking: 'TerraMind பகுப்பாய்வு செய்கிறது…',
    error: 'TerraMind இப்போது தகவல்களை பெற முடியவில்லை.', backendError: 'TerraMind தற்காலிகமாக கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.',
    retry: 'மீண்டும் முயற்சி', welcome: 'வணக்கம்! உங்கள் பயிர், சந்தை விலை, வாங்குபவர்கள், விற்பனை நேரம் அல்லது விவசாய முடிவுகள் பற்றி என்னிடம் கேளுங்கள்.',
    sources: 'அடிப்படையில்:', micDenied: 'குரல் உள்ளீட்டிற்கு மைக்ரோஃபோன் அனுமதி தேவை.',
    micUnsupported: 'இந்த சாதனத்தில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.', listening: 'கேட்கிறது…',
  },
  mr: {
    title: 'TerraMind AI', subtitle: 'कृषी बाजार बुद्धिमत्ता सहाय्यक',
    placeholder: 'तुमच्या शेताबद्दल विचारा…', thinking: 'TerraMind विश्लेषण करत आहे…',
    error: 'TerraMind आत्ता माहिती मिळवू शकला नाही.', backendError: 'TerraMind तात्पुरते अनुपलब्ध आहे. पुन्हा प्रयत्न करा.',
    retry: 'पुन्हा प्रयत्न', welcome: 'नमस्कार! तुमचे पीक, बाजारभाव, खरेदीदार, विक्रीची वेळ किंवा शेतीचे निर्णय याबद्दल मला विचारा.',
    sources: 'यावर आधारित:', micDenied: 'व्हॉइस इनपुटसाठी मायक्रोफोन परवानगी आवश्यक आहे.',
    micUnsupported: 'या डिव्हाइसवर व्हॉइस इनपुट समर्थित नाही.', listening: 'ऐकत आहे…',
  },
  hi: {
    title: 'TerraMind AI', subtitle: 'कृषि बाजार सूचना सहायक',
    placeholder: 'अपने खेत के बारे में पूछें…', thinking: 'TerraMind विश्लेषण कर रहा है…',
    error: 'TerraMind अभी जानकारी प्राप्त नहीं कर सका।', backendError: 'TerraMind अस्थायी रूप से उपलब्ध नहीं है। फिर प्रयास करें।',
    retry: 'फिर प्रयास करें', welcome: 'नमस्ते! अपनी फसल, बाजार भाव, खरीदार, बिक्री समय या खेती के निर्णयों के बारे में पूछें।',
    sources: 'आधार:', micDenied: 'वॉइस इनपुट के लिए माइक्रोफोन अनुमति आवश्यक है.',
    micUnsupported: 'इस डिवाइस पर वॉइस इनपुट समर्थित नहीं है.', listening: 'सुन रहा है…',
  },
}

const VOICE_LANG: Record<Language, string> = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN', mr: 'mr-IN' }

const QUICK_Q: Record<Language, string[]> = {
  en: ['What should I grow?', 'When should I sell?', 'Which market is better?', 'Who can buy my crop?', 'Why is the price changing?', 'Should I store my crop?'],
  ta: ['என்ன பயிரிட வேண்டும்?', 'எப்போது விற்பனை செய்வது?', 'எந்த சந்தை சிறந்தது?', 'யார் வாங்குவார்கள்?', 'விலை ஏன் மாறுகிறது?', 'சேமிக்கவா விற்கவா?'],
  mr: ['काय पिकवावे?', 'कधी विकावे?', 'कोणती बाजारपेठ चांगली?', 'माझे पीक कोण खरेदी करेल?', 'भाव का बदलत आहे?', 'साठवायचे की विकायचे?'],
  hi: ['क्या उगाऊं?', 'कब बेचूं?', 'कौन सा बाजार बेहतर है?', 'मेरी फसल कौन खरीदेगा?', 'भाव क्यों बदल रहा है?', 'भंडारण करूं या बेचूं?'],
}

type Reply = { text: string; sources?: string[] }

function getReply(msg: string, lang: Language): Reply {
  const q = msg.toLowerCase()
  const generic = {
    en: {
      grow: { text: 'I cannot provide a live crop recommendation without verified land, weather, and market evidence. The current app state is TEST_DATA only until the backend validates the source and freshness metadata.', sources: ['TEST_DATA', 'Source validation pending'] },
      sell: { text: 'Selling guidance is unavailable until verified market data and a recent price window are connected. This app is currently in TEST_DATA or source-pending mode.', sources: ['TEST_DATA', 'Market window pending'] },
      market: { text: 'Market information is temporarily unavailable. Verified price, arrival, and buyer records are required before a live recommendation can be shown.', sources: ['TEST_DATA', 'Market data unavailable'] },
      buyer: { text: 'Verified buyer information is currently unavailable. The app does not invent buyers or FPOs without source validation.', sources: ['TEST_DATA', 'Buyer registry unavailable'] },
      price: { text: 'Price and forecast data are not live. This app is currently showing TEST_DATA or unavailable states rather than fabricated market values.', sources: ['TEST_DATA', 'Forecast unavailable'] },
      store: { text: 'Storage guidance is on hold until verified supply, arrival, and market risk data are available from the backend.', sources: ['TEST_DATA', 'Storage risk not validated'] },
      change: { text: 'I cannot explain a price change as a real market event without a validated source. Current price movement is not confirmed live data.', sources: ['TEST_DATA', 'Evidence validation required'] },
      default: { text: 'Ask me about crop recommendations, market prices, storage timing, or farm decisions. If the backend has not validated the data, the answer will be marked as unavailable or TEST_DATA.', sources: ['TerraMind', 'Source validation'] },
    },
    ta: {
      grow: { text: 'சான்று சரிபார்க்கப்படாத வரை நேரடி பயிர் பரிந்துரை வழங்க முடியாது. தற்போதைய நிலை TEST_DATA மட்டுமே; ஆதாரம் மற்றும் புத்துணர்வு மெட்டாடேட்டா சரிபார்க்கப்படும் வரை இது நேரடி ஆலோசனை அல்ல.', sources: ['TEST_DATA', 'ஆதாரம் சரிபார்ப்பு நிலுவையில்'] },
      sell: { text: 'சரிபார்க்கப்பட்ட சந்தை தரவு இல்லாமல் விற்பனை வழிகாட்டுதல் கிடைக்கவில்லை. தற்போதைய பயன்பாடு TEST_DATA அல்லது ஆதாரம் நிலுவையில் உள்ளது.', sources: ['TEST_DATA', 'விலை சாளரம் நிலுவையில்'] },
      market: { text: 'சந்தை தகவல் தற்காலிகமாக கிடைக்கவில்லை. நேரடி விலை, வரத்து மற்றும் வாங்குபவர் பதிவுகள் சரிபார்க்கப்பட வேண்டும்.', sources: ['TEST_DATA', 'சந்தை தரவு இல்லை'] },
      buyer: { text: 'சரிபார்க்கப்பட்ட வாங்குபவர் தகவல் தற்போது கிடைக்கவில்லை. ஆதாரம் இல்லாமல் வாங்குபவர்கள் அல்லது FPOகள் உருவாக்கப்படுவதில்லை.', sources: ['TEST_DATA', 'வாங்குபவர் பதிவேடு இல்லை'] },
      price: { text: 'விலை மற்றும் முன்னறிவிப்பு தரவு நேரடி இல்லை. நேரடி விலை மதிப்புகளை உருவாக்காமல் TEST_DATA அல்லது கிடைக்காத நிலையை காட்டுகிறோம்.', sources: ['TEST_DATA', 'முன்னறிவிப்பு இல்லை'] },
      store: { text: 'சரிபார்க்கப்பட்ட வழங்கல், வரத்து மற்றும் சந்தை ஆபத்து தரவு வருவதuntil the backend validates the source and freshness metadata வரை சேமிப்பு வழிகாட்டுதல் நிறுத்தி வைக்கப்பட்டுள்ளது.', sources: ['TEST_DATA', 'சேமிப்பு ஆபத்து சரிபார்க்கப்படவில்லை'] },
      change: { text: 'சரிபார்க்கப்பட்ட ஆதாரம் இல்லாமல் விலை மாற்றத்தை உண்மையான சந்தை நிகழ்வாக விளக்க முடியாது. தற்போதைய மாற்றம் நேரடி தரவு அல்ல.', sources: ['TEST_DATA', 'ஆதாரம் சரிபார்ப்பு தேவை'] },
      default: { text: 'பயிர் பரிந்துரை, சந்தை விலை, சேமிப்புத் timing, அல்லது பண்ணை முடிவுகள் பற்றி கேளுங்கள். பின்தளத்தில் தரவு சரிபார்க்கப்படாவிட்டால், பதில் unavailable அல்லது TEST_DATA என குறிக்கப்படும்.', sources: ['TerraMind', 'ஆதாரம் சரிபார்ப்பு'] },
    },
    hi: {
      grow: { text: 'प्रमाणित भूमि, मौसम और बाजार साक्ष्य के बिना फसल की सिफारिश उपलब्ध नहीं है।', sources: ['TerraMind', 'साक्ष्य सत्यापन लंबित'] },
      sell: { text: 'सत्यापित बाजार डेटा उपलब्ध होने तक बिक्री मार्गदर्शन उपलब्ध नहीं है।', sources: ['TerraMind', 'बाजार डेटा उपलब्ध नहीं'] },
      market: { text: 'सत्यापित भाव, आवक और खरीदार रिकॉर्ड उपलब्ध नहीं हैं।', sources: ['TerraMind', 'बाजार डेटा उपलब्ध नहीं'] },
      buyer: { text: 'सत्यापित खरीदार जानकारी उपलब्ध नहीं है; ऐप खरीदारों का अनुमान नहीं लगाता।', sources: ['TerraMind', 'खरीदार रजिस्ट्री उपलब्ध नहीं'] },
      price: { text: 'भाव और पूर्वानुमान लाइव सत्यापित नहीं हैं।', sources: ['TerraMind', 'पूर्वानुमान उपलब्ध नहीं'] },
      store: { text: 'सत्यापित आपूर्ति, आवक और बाजार जोखिम डेटा के बिना भंडारण मार्गदर्शन उपलब्ध नहीं है।', sources: ['TerraMind', 'जोखिम सत्यापन लंबित'] },
      change: { text: 'सत्यापित स्रोत के बिना भाव परिवर्तन का कारण नहीं बताया जा सकता।', sources: ['TerraMind', 'साक्ष्य सत्यापन आवश्यक'] },
      default: { text: 'फसल, बाजार भाव, बिक्री समय या खेती के निर्णयों के बारे में पूछें।', sources: ['TerraMind', 'साक्ष्य सत्यापन'] },
    },
    mr: {
      grow: { text: 'प्रमाणित जमीन, हवामान आणि बाजार पुरावे न मिळाल्यास थेट पीक शिफारस देऊ शकत नाही. सध्याची स्थिती TEST_DATA आहे; स्रोत आणि ताजेपणा मेटाडेटा सत्यापित होईपर्यंत ही थेट सल्ला नाही.', sources: ['TEST_DATA', 'स्रोत पडताळणी प्रलंबित'] },
      sell: { text: 'सत्यापित बाजार डेटा आणि अलीकडील भाव विंडो उपलब्ध नाही तोपर्यंत विक्री मार्गदर्शन उपलब्ध नाही. हे अॅप सध्या TEST_DATA किंवा स्रोत-प्रलंबित मोडमध्ये आहे.', sources: ['TEST_DATA', 'बाजार विंडो प्रलंबित'] },
      market: { text: 'बाजार माहिती तात्पुरते उपलब्ध नाही. थेट भाव, आवक आणि खरेदीदार नोंदी सत्यापित होईपर्यंत माहिती दाखवली जाणार नाही.', sources: ['TEST_DATA', 'बाजार डेटा उपलब्ध नाही'] },
      buyer: { text: 'सत्यापित खरेदीदार माहिती सध्या उपलब्ध नाही. स्त्रोत पडताळणी न झाल्याशिवाय खरेदीदार किंवा FPO तयार केले जात नाहीत.', sources: ['TEST_DATA', 'खरेदीदार नोंदणी उपलब्ध नाही'] },
      price: { text: 'भाव आणि अंदाज डेटा थेट नाही. हे अॅप बनावट बाजार मूल्ये दाखवत नाही; TEST_DATA किंवा उपलब्ध नसलेली स्थिती दाखवते.', sources: ['TEST_DATA', 'अंदाज उपलब्ध नाही'] },
      store: { text: 'सत्यापित पुरवठा, आवक आणि बाजार धोकादायकता उपलब्ध नाही तोपर्यंत साठवणूक मार्गदर्शन थांबवले आहे.', sources: ['TEST_DATA', 'साठवणूक जोखीम सत्यापित नाही'] },
      change: { text: 'सत्यापित स्रोताशिवाय भाव बदलाचे कारण सांगता येत नाही. सध्याचा बदल थेट डेटा नाही.', sources: ['TEST_DATA', 'साक्ष पडताळणी आवश्यक'] },
      default: { text: 'पीक शिफारस, बाजारभाव, साठवणूक वेळ, किंवा शेत निर्णयांबद्दल विचारा. जर बॅकएंडमधील डेटा सत्यापित नसेल, तर उत्तर unavailable किंवा TEST_DATA म्हणून दर्शवले जाईल.', sources: ['TerraMind', 'स्रोत पडताळणी'] },
    },
  }

  const s = generic[lang]
  if (q.match(/grow|ugaen|pikvave|piyar/)) return s.grow
  if (q.match(/sell|vitre|vikaave|beche/)) return s.sell
  if (q.match(/market|mandi|santha|bajar/)) return s.market
  if (q.match(/buy|vanguvaar|khareede|kharidi/)) return s.buyer
  if (q.match(/price|vila|bhav|daam|today|aaj|indru/)) return s.price
  if (q.match(/store|saemi|sathva|rakhe|hold/)) return s.store
  if (q.match(/chang|maari|badal|yen.*vila|yen.*bhav/)) return s.change
  return s.default
}

/* ── Speech Recognition helper ── */
const SR = (typeof window !== 'undefined') ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null

interface ChatMessage { role: 'user' | 'ai'; text: string; sources?: string[]; failed?: boolean; id: number }

interface Props { onNav: (s: Screen) => void; language: Language }

const MAX_HIST = 10

export function ChatbotScreen({ onNav, language }: Props) {
  const lbl = L[language]
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'ai', text: lbl.welcome, id: 0 }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [failedId, setFailedId] = useState<number | null>(null)
  const [lastMsg, setLastMsg] = useState('')
  const [listening, setListening] = useState(false)
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(1)
  const recogRef = useRef<any>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  /* derived avatar state */
  useEffect(() => {
    if (loading) { setAvatarState('thinking'); return }
    if (listening) { setAvatarState('listening'); return }
    if (speakingId !== null) { setAvatarState('speaking'); return }
    setAvatarState('idle')
  }, [loading, listening, speakingId])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', text: text.trim(), id: idRef.current++ }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setFailedId(null)
    setLastMsg(text.trim())
    try {
      const reply = await api.chat(text.trim(), language)
      const aiMsg: ChatMessage = { role: 'ai', text: reply.text, sources: reply.sources, id: idRef.current++ }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      const reply = getReply(text.trim(), language)
      const aiMsg: ChatMessage = { role: 'ai', text: reply.text, sources: reply.sources, id: idRef.current++ }
      setMessages(prev => [...prev, aiMsg])
    } finally {
      setLoading(false)
    }
  }

  function handleRetry() {
    setMessages(prev => prev.filter(m => m.id !== failedId))
    setFailedId(null)
    sendMessage(lastMsg)
  }

  /* Voice recognition */
  function toggleVoice() {
    if (listening) {
      recogRef.current?.stop()
      setListening(false)
      return
    }
    if (!SR) { alert(lbl.micUnsupported); return }
    const recog = new SR()
    recog.lang = VOICE_LANG[language]
    recog.continuous = false
    recog.interimResults = true
    recog.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('')
      setInput(transcript)
    }
    recog.onerror = (e: any) => {
      setListening(false)
      if (e.error === 'not-allowed') alert(lbl.micDenied)
    }
    recog.onend = () => setListening(false)
    try { recog.start(); recogRef.current = recog; setListening(true) } catch { alert(lbl.micUnsupported) }
  }

  /* Text to speech */
  function speak(msg: ChatMessage) {
    if (!window.speechSynthesis) return
    if (speakingId === msg.id) { window.speechSynthesis.cancel(); setSpeakingId(null); return }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(msg.text)
    utter.lang = VOICE_LANG[language]
    utter.onstart = () => setSpeakingId(msg.id)
    utter.onend = () => setSpeakingId(null)
    utter.onerror = () => setSpeakingId(null)
    window.speechSynthesis.speak(utter)
  }

  const ttsSupported = typeof window !== 'undefined' && !!window.speechSynthesis

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#2D3C20' }}>
      {/* Header */}
      <div className="shrink-0 px-4 pt-11 pb-3 border-b border-white/10" style={{ background: '#2D3C20' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => { window.speechSynthesis?.cancel(); onNav('dashboard') }}
            className="w-9 h-9 rounded-full bg-white/12 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <TerraMindAvatar state={avatarState} size={48} showLabel={false} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-app-green animate-pulse shrink-0" />
              <p className="font-sans font-800 text-white text-base">{lbl.title}</p>
            </div>
            <p className="font-sans text-white/45 text-xs truncate">{lbl.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-xl bg-app-orange/15 border border-app-orange/25 flex items-center justify-center shrink-0 mr-2 mt-1 overflow-hidden">
                <span className="text-base">🌿</span>
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'max-w-[75%]' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-app-orange text-white rounded-tr-sm' : 'card-dark text-white rounded-tl-sm'}`}>
                <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-1.5 px-1">
                  <p className="font-mono text-[10px] text-white/30">{lbl.sources}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {msg.sources.map((s, i) => (
                      <span key={i} className="font-mono text-[10px] text-white/45 bg-white/8 px-2 py-0.5 rounded-full border border-white/10">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* TTS button on AI messages */}
              {msg.role === 'ai' && ttsSupported && (
                <button
                  onClick={() => speak(msg)}
                  aria-label="Read response aloud"
                  className={`mt-1.5 ml-1 flex items-center gap-1 font-sans text-[11px] font-600 transition-colors ${speakingId === msg.id ? 'text-app-orange' : 'text-white/30 hover:text-white/60'}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    {speakingId === msg.id
                      ? <><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
                      : <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
                  </svg>
                  {speakingId === msg.id ? 'Stop' : '🔊'}
                </button>
              )}
              {msg.failed && (
                <button onClick={handleRetry} className="mt-2 ml-1 font-sans text-xs text-app-orange font-700 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.96"/></svg>
                  {lbl.retry}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-app-orange/15 border border-app-orange/25 flex items-center justify-center shrink-0 mr-2 mt-1"><span className="text-base">🌿</span></div>
            <div className="card-dark rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-app-orange/60 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                </div>
                <p className="font-sans text-white/50 text-xs">{lbl.thinking}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick questions */}
        {messages.length === 1 && !loading && (
          <div className="pt-2">
            <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-2 px-1">Quick questions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_Q[language].map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="font-sans text-xs font-600 text-white/80 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 active:scale-95 transition-transform">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-white/10" style={{ background: '#2D3C20' }}>
        {listening && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="w-2 h-2 rounded-full bg-app-sky animate-pulse" />
            <span className="font-sans text-xs text-app-sky font-600">{lbl.listening}</span>
          </div>
        )}
        <div className="flex gap-2 items-center">
          {/* Microphone button */}
          <button
            onClick={toggleVoice}
            aria-label="Start voice input"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-all ${listening ? 'bg-app-sky' : 'bg-white/10 border border-white/15'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={listening ? 'white' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="2" width="6" height="11" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder={listening ? lbl.listening : lbl.placeholder}
            className="input-dark flex-1 text-sm"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-11 h-11 bg-app-orange rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
