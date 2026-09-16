import type { Farm } from '../types'

export const farms: Farm[] = [
  {
    id: 'farm-01',
    name: 'Madurai Farm',
    district: 'Madurai',
    areaAcres: 2.4,
    currentCrop: 'Groundnut',
    soilType: 'Red soil',
    ph: 6.7,
    waterSource: 'Borewell',
    healthScore: 87,
    marketHealth: 'LOW',
    location: 'Madurai, Tamil Nadu',
    lat: 9.9252,
    lng: 78.1198,
    fields: [
      {
        id: 'field-1',
        name: 'North Field',
        polygon: [
          [9.926, 78.118],
          [9.926, 78.121],
          [9.924, 78.121],
          [9.924, 78.118],
        ],
        areaAcres: 1.2,
      },
    ],
  },
]
