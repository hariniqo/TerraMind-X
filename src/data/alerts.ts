import type { AlertItem } from '../types'

export const alerts: AlertItem[] = [
  {
    id: 'alert-01',
    category: 'Market',
    severity: 'HIGH',
    title: 'Tomato oversupply risk increased.',
    message: 'Prices are falling as arrivals increase this week.',
    time: '1h ago',
  },
  {
    id: 'alert-02',
    category: 'Soil',
    severity: 'MEDIUM',
    title: 'Soil moisture decreasing.',
    message: 'Monitor irrigation if rain does not arrive soon.',
    time: '3h ago',
  },
  {
    id: 'alert-03',
    category: 'Crop',
    severity: 'LOW',
    title: 'Groundnut growth is healthy.',
    message: 'No pest alerts were detected in the last 24 hours.',
    time: '5h ago',
  },
]
