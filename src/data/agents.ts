import type { Agent } from '../types'

export const agents: Agent[] = [
  {
    id: 'land',
    name: 'Land Intelligence',
    score: 91,
    insight: 'Strong suitability for groundnut.',
    status: 'good',
  },
  {
    id: 'soil',
    name: 'Soil Guardian',
    score: 84,
    insight: 'Healthy pH and adequate nutrients.',
    status: 'good',
  },
  {
    id: 'agronomy',
    name: 'Agronomy Intelligence',
    score: 88,
    insight: 'Current conditions support growth.',
    status: 'good',
  },
  {
    id: 'market',
    name: 'Market Intelligence',
    score: 82,
    insight: 'Low oversupply risk for groundnut.',
    status: 'good',
  },
  {
    id: 'sustainability',
    name: 'Sustainability Intelligence',
    score: 86,
    insight: 'Moderate water demand and soil-friendly crop.',
    status: 'good',
  },
]
