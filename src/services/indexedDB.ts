import logger from '../utils/logger'
/**
 * IndexedDB Offline Storage & Synchronization Layer for TerraMind-X
 * Ensures zero message loss in low-connectivity or rural environments.
 */

const DB_NAME = 'terramind_x_db'
const DB_VERSION = 1
const STORE_MESSAGES = 'chat_messages'
const STORE_SAVED_ADVICE = 'saved_advisories'
const STORE_OFFLINE_QUEUE = 'offline_message_queue'

export interface OfflineMessage {
  id: string
  query: string
  language: string
  farmContext: any
  timestamp: string
  status: 'pending' | 'synced' | 'failed'
}

export interface SavedAdvisory {
  id: string
  title: string
  crop: string
  advisoryText: string
  timestamp: string
  category: 'sowing' | 'disease' | 'soil' | 'market' | 'general'
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: any) => {
      const db: IDBDatabase = event.target.result

      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_SAVED_ADVICE)) {
        db.createObjectStore(STORE_SAVED_ADVICE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
        db.createObjectStore(STORE_OFFLINE_QUEUE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveMessageOffline(message: any): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_MESSAGES, 'readwrite')
    tx.objectStore(STORE_MESSAGES).put(message)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    logger.warn('Failed to save message to IndexedDB:', e)
  }
}

export async function getCachedMessages(): Promise<any[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_MESSAGES, 'readonly')
    const request = tx.objectStore(STORE_MESSAGES).getAll()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    logger.warn('Failed to fetch cached messages:', e)
    return []
  }
}

export async function enqueueOfflineQuery(query: OfflineMessage): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite')
    tx.objectStore(STORE_OFFLINE_QUEUE).put(query)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    logger.warn('Failed to enqueue offline query:', e)
  }
}

export async function getOfflineQueue(): Promise<OfflineMessage[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readonly')
    const request = tx.objectStore(STORE_OFFLINE_QUEUE).getAll()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    logger.warn('Failed to get offline queue:', e)
    return []
  }
}

export async function clearOfflineQueueItem(id: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite')
    tx.objectStore(STORE_OFFLINE_QUEUE).delete(id)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    logger.warn('Failed to clear item from offline queue:', e)
  }
}

export async function saveAdvisoryForOffline(advisory: SavedAdvisory): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_SAVED_ADVICE, 'readwrite')
    tx.objectStore(STORE_SAVED_ADVICE).put(advisory)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    logger.warn('Failed to bookmark advisory in IndexedDB:', e)
  }
}

export async function getSavedAdvisories(): Promise<SavedAdvisory[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_SAVED_ADVICE, 'readonly')
    const request = tx.objectStore(STORE_SAVED_ADVICE).getAll()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    logger.warn('Failed to get saved advisories from IndexedDB:', e)
    return []
  }
}
