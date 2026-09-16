import logger from '../utils/logger'
import { useState, useEffect } from 'react'
import { getFarmerProfile, saveFarmerProfile, FarmerProfile } from '../services/api'

export type FarmMode = 'plan_my_crop' | 'already_sown'

export interface FarmState {
  name: string
  village: string
  district: string
  state: string
  acres: number
  currentCrop: string
  previousCrop: string
  soilType: string
  soilPh: number
  soilHealthScore: number
  irrigationType: string
  waterSource: string
  temperatureC: number
  humidityPct: number
  rainfallForecastMm: number
  mode: FarmMode // Pre-sowing vs Mid-Season Damage Control
  lastUpdated: string
}

const DEFAULT_FARM: FarmState = {
  name: 'Madurai Precision Field',
  village: 'Melur',
  district: 'Madurai',
  state: 'Tamil Nadu',
  acres: 2.5,
  currentCrop: 'Tomato',
  previousCrop: 'Paddy (Rice)',
  soilType: 'Red Loam',
  soilPh: 6.8,
  soilHealthScore: 78,
  irrigationType: 'Drip Irrigation',
  waterSource: 'Borewell & Farm Pond',
  temperatureC: 31,
  humidityPct: 62,
  rainfallForecastMm: 14,
  mode: 'plan_my_crop',
  lastUpdated: 'Live IMD Synced'
}

const FARM_STORAGE_KEY = 'terramind_farm_state'

function loadSavedFarm(): FarmState {
  if (typeof window === 'undefined') return DEFAULT_FARM
  try {
    const saved = localStorage.getItem(FARM_STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_FARM, ...JSON.parse(saved) }
    }
    const profile = getFarmerProfile()
    if (profile) {
      return {
        ...DEFAULT_FARM,
        name: profile.name || DEFAULT_FARM.name,
        village: profile.village || DEFAULT_FARM.village,
        district: profile.district || DEFAULT_FARM.district,
        acres: profile.areaAcres || DEFAULT_FARM.acres,
        currentCrop: profile.currentCrop || DEFAULT_FARM.currentCrop,
        soilType: profile.soilType || DEFAULT_FARM.soilType,
        irrigationType: profile.irrigationType || DEFAULT_FARM.irrigationType,
        mode: profile.alreadyPlanted ? 'already_sown' : 'plan_my_crop'
      }
    }
  } catch (e) {
    logger.warn('Failed to load farm state:', e)
  }
  return DEFAULT_FARM
}

let globalFarm: FarmState = loadSavedFarm()
const farmListeners = new Set<(farm: FarmState) => void>()

function notifyFarmListeners() {
  farmListeners.forEach((l) => l(globalFarm))
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(globalFarm))
    } catch (e) {}
  }
}

export function useFarmStore() {
  const [farm, setFarm] = useState<FarmState>(globalFarm)

  useEffect(() => {
    const listener = (newFarm: FarmState) => setFarm({ ...newFarm })
    farmListeners.add(listener)
    return () => {
      farmListeners.delete(listener)
    }
  }, [])

  const updateFarm = (partial: Partial<FarmState>) => {
    globalFarm = { ...globalFarm, ...partial }
    notifyFarmListeners()
  }

  const setMode = (mode: FarmMode) => {
    globalFarm = { ...globalFarm, mode }
    notifyFarmListeners()
  }

  return {
    ...farm,
    updateFarm,
    setMode
  }
}
