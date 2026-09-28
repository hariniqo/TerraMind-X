// Global data-mode configuration for TerraMind-X.
// REAL_ONLY: no mock / synthetic / placeholder data is ever presented as real.
// Development placeholders must be visually + technically separated from production data.
export const DATA_MODE = 'REAL_ONLY'

export function isRealOnly() {
  return DATA_MODE === 'REAL_ONLY'
}