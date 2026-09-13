import { type FarmInput } from './api'

export const defaultFarm: FarmInput = {
  farmer_id: 'F001',
  location: { district: 'Nashik', village: 'Dindori' },
  acreage: 4.5,
  soil: { ph: 6.8, moisture: 29.5, nitrogen: 48, phosphorus: 25, potassium: 190 },
  current_crop: 'onion',
}
