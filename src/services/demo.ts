import { farms } from '../data/farms'

export function startDemo() {
  const demoProfile = {
    farmer: 'Ravi Kumar',
    location: 'Tamil Nadu',
    farmArea: 4.8,
    crop: 'Tomato',
  }
  localStorage.setItem('terramind_demo', JSON.stringify(demoProfile))
}

export function getDemoProfile() {
  const raw = localStorage.getItem('terramind_demo')
  if (!raw) return null
  return JSON.parse(raw)
}

export function clearDemo() {
  localStorage.removeItem('terramind_demo')
}

export function getDemoFarm() {
  return farms[0]
}
