import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

const updates = [
  { title: 'Agri AI Council update', description: 'New sustainability guidelines available for groundnut rotations.', time: '2h ago', type: 'info' },
  { title: 'Market pulse alert', description: 'Rice demand is rising across the southern corridor.', time: '4h ago', type: 'success' },
  { title: 'Weather advisory', description: 'Light showers expected in the next 24 hours.', time: '8h ago', type: 'warning' },
]

export function CommunityPage() {
  return (
    <div className="space-y-6">
      <Card title="Community hub">
        <p className="text-terra-600">Stay connected to local advisories, crop councils, and field intelligence in your region.</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {updates.map((update) => (
          <Card key={update.title} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-terra-900">{update.title}</h3>
              <Badge label={update.type} tone={update.type === 'success' ? 'success' : update.type === 'warning' ? 'warning' : 'info'} />
            </div>
            <p className="text-terra-600">{update.description}</p>
            <p className="text-sm text-terra-500">{update.time}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default CommunityPage
