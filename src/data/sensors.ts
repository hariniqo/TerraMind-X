import type { SensorNode } from '../types'

export const sensorNodes: SensorNode[] = [
  { id: 'node-01', label: 'Node 01', status: 'online', temp: 31.2, humidity: 68, moisture: 42 },
  { id: 'node-02', label: 'Node 02', status: 'online', temp: 30.8, humidity: 66, moisture: 48 },
  { id: 'node-03', label: 'Node 03', status: 'warning', temp: 32.1, humidity: 70, moisture: 35 },
  { id: 'node-04', label: 'Node 04', status: 'offline', temp: 0, humidity: 0, moisture: 0 },
]
