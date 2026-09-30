import { useEffect, useState } from 'react'
import { Header } from '@/components/terra/shared'
import { farmData } from '@/data/terraData'
import { fetchBuyers } from '@/lib/realData'
import { sendBuyerEmail } from '@/lib/buyerEmailRuntime'

const TYPE_ICON = { Processor: '🏭', FPO: '👥', Institutional: '🏛️', 'Mandi Trader': '🏪' }

export function BuyersScreen({ onNav }) {
  const farmer = farmData.farmer
  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({})

  useEffect(() => {
    fetchBuyers().then(setBuyers).finally(() => setLoading(false))
  }, [])

  async function contact(b) {
    const email = b.email || b.contact_information
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setStatus((s) => ({ ...s, [b.id]: 'noemail' })); return }
    setStatus((s) => ({ ...s, [b.id]: 'sending' }))
    try {
      await sendBuyerEmail({ ...b, email }, farmer)
      setStatus((s) => ({ ...s, [b.id]: 'sent' }))
    } catch (e) {
      setStatus((s) => ({ ...s, [b.id]: 'error' }))
    }
  }

    return (
      <div className="topo min-h-screen pb-8 text-white">
        <Header title="Verified buyers" onBack={() => onNav('market')} />
        {loading && <p role="status">Loading buyer records...</p>}
        {!loading && buyers.length === 0 && <p>No verified buyer records are currently available.</p>}
        {buyers.map((buyer) => (
          <article key={buyer.id} className="m-4 rounded-xl bg-app-surface p-4">
            <h2>{buyer.buyer_name}</h2>
            <p>{buyer.buyer_type} · {buyer.location || 'Location unavailable'}</p>
            <button type="button" onClick={() => contact(buyer)} disabled={!buyer.email}>
              {status[buyer.id] === 'sent' ? 'Request sent' : 'Contact buyer'}
            </button>
          </article>
        ))}
      </div>
    )
  }