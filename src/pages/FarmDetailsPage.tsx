import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getFarmById } from '../services/api'
import { Card } from '../components/ui/Card'

export function FarmDetailsPage() {
  const { id } = useParams()
  const [farm, setFarm] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    getFarmById(id).then(setFarm)
  }, [id])

  if (!farm) return <div>Loading…</div>

  return (
    <div className="space-y-6">
      <Card title={farm.name}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-terra-600">Location: {farm.location}</p>
            <p className="mt-2 text-sm text-terra-600">Area: {farm.areaAcres} acres</p>
            <p className="mt-2 text-sm text-terra-600">Soil: {farm.soilType}</p>
          </div>
          <div>
            <p className="text-sm text-terra-600">Current crop: {farm.currentCrop}</p>
            <p className="mt-2 text-sm text-terra-600">Health score: {farm.healthScore}%</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FarmDetailsPage
