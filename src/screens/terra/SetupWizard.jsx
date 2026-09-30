import { useState, useEffect } from 'react'

import { CROPS, demoQuery, syntheticHistory, parseISODate, ymd, addDays } from '@/lib/marketEngine'
import { fetchFestivals, fetchVillageCropShares } from '@/lib/realData'

const SOIL_TYPES = ['loam', 'red', 'sandy loam', 'black']
const WATER_OPTS = [
  { id: 'low', label: 'Low', icon: '💧', desc: 'Rainfed / dryland' },
  { id: 'medium', label: 'Medium', icon: '🚿', desc: 'Borewell + rainfall' },
  { id: 'high', label: 'High', icon: '🌊', desc: 'Canal / ample irrigation' },
]
const RISK_OPTS = [
  { id: 'balanced', label: 'Balanced', desc: 'Equal weight to profit & safety' },
  { id: 'max_profit', label: 'Max Profit', desc: 'Chase the highest returns' },
  { id: 'stable_income', label: 'Stable Income', desc: 'Prioritise low-volatility crops' },
]
const CROP_LABEL = { tomato: 'Tomato', chilli: 'Chilli', onion: 'Onion', brinjal: 'Brinjal', okra: 'Okra', ragi: 'Ragi', groundnut: 'Groundnut', maize: 'Maize' }
const CROP_EMOJI = { tomato: '🍅', chilli: '🌶️', onion: '🧅', brinjal: '🍆', okra: '🫛', ragi: '🌾', groundnut: '🥜', maize: '🌽' }

function seasonOf(dateStr) {
  const m = Number(dateStr?.slice(5, 7))
  return m >= 6 && m <= 10 ? 'kharif' : 'rabi'
}