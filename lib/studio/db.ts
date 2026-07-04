/**
 * Dexie (IndexedDB) database for Studio assets
 */
import Dexie, { type Table } from 'dexie'

import type { StudioAsset } from './types'

/**
 * Studio IndexedDB database
 * Stores user assets so work survives page reloads
 */
export class StudioDatabase extends Dexie {
  /** Asset table */
  assets!: Table<StudioAsset, string>

  constructor() {
    super('studio-db')
    this.version(1).stores({
      assets: 'id, kind, source, parentId, createdAt, updatedAt',
    })
  }
}

/** Singleton database instance */
let dbInstance: StudioDatabase | null = null

/**
 * Get the shared Studio database instance
 * @returns Dexie database instance
 */
export function getStudioDb(): StudioDatabase {
  if (!dbInstance) {
    dbInstance = new StudioDatabase()
  }
  return dbInstance
}
