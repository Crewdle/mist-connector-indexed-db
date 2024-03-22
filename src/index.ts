import { v4 } from 'uuid';

import type { ValueTypeOmitId, IDatabaseTableQuery, IDatabaseTableQueryWhereValue, IDatabaseTableQueryWhereValues, IValueType, IDatabaseLayout, IKeyValueDatabaseConnector, IKeyValueDatabaseMigrationHandle, IKeyValueDatabaseTableConnector } from '@crewdle/web-sdk';

import { idbRequest, idbCursor } from './helpers';

/**
 * The indexedDB key-value database connector - Connect to an indexedDB database.
 * @category Connector
 */
export class IDBDatabaseConnector implements IKeyValueDatabaseConnector {
  /**
   * The indexedDB database.
   * @ignore
   */
  private db?: IDBDatabase;

  /**
   * The constructor.
   * @param dbKey The database key.
   * @param layout The database layout.
   */
  constructor(
    private readonly dbKey: string,
    private readonly layout: IDatabaseLayout
  ) {}

  /**
   * Opens the database.
   * @param migration The migration function.
   * @returns A promise that resolves when the database is open.
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbKey, this.layout.version);

      request.onupgradeneeded = (event) => {
        const target = event.target as IDBOpenDBRequest;
        const db = target.result;
        const transaction = target.transaction;

        for (const tableName in this.layout.tables) {
          const table = this.layout.tables[tableName];
          const store = transaction?.objectStore(tableName);
          if (db.objectStoreNames.contains(tableName)) {
            table.indexes?.forEach((index) => {
              if (!store?.indexNames.contains(index.keyPath)) {
                store?.createIndex(index.keyPath, index.keyPath);
              }
            });

            for (const index of Array.from(store?.indexNames ?? [])) {
              if (!table.indexes?.find((i) => i.keyPath === index)) {
                store?.deleteIndex(index);
              }
            }

            continue;
          }

          db.createObjectStore(tableName, { keyPath: 'id' });
          table.indexes?.forEach((index) => {
            store?.createIndex(index.keyPath, index.keyPath);
          });

          for (const table in db.objectStoreNames) {
            if (!this.layout.tables[table]) {
              db.deleteObjectStore(table);
            }
          }
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = (event) => {
        reject(event);
      };
    });
  }

  /**
   * Closes the database.
   */
  close(): void {
    this.db?.close();
  }

  /**
   * Checks if the table exists.
   * @param tableName The table name.
   * @returns True if the table exists, false otherwise.
   */
  hasTable(tableName: string): boolean {
    if (!this.db) {
      throw new Error('Database not open');
    }

    return this.db.objectStoreNames.contains(tableName) ?? false;
  }

  /**
   * Creates a table.
   * @param tableName The table name.
   */
  createTable(tableName: string): void {
    if (!this.db) {
      throw new Error('Database not open');
    }

    if (this.hasTable(tableName)) {
      throw new Error(`Table ${tableName} already exists`);
    }

    this.db.createObjectStore(tableName, { keyPath: 'id' });
  }

  /**
   * Gets a table connector.
   * @param tableName The table name.
   * @returns A table connector.
   */
  getTableConnector<T extends IValueType>(tableName: string): IKeyValueDatabaseTableConnector<T> {
    if (!this.db) {
      throw new Error('Database not open');
    }

    if (!this.hasTable(tableName)) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    return new IDBDatabaseTableConnector<T>(this.db, tableName);
  }
}

/**
 * The indexedDB database table connector - Connect to a table in an indexedDB database.
 * @category Connector
 */
export class IDBDatabaseTableConnector<T extends IValueType> implements IKeyValueDatabaseTableConnector<T> {
  /**
   * The constructor.
   * @param db The indexedDB database.
   * @param tableName The table name.
   */
  constructor(
    private readonly db: IDBDatabase,
    private readonly tableName: string
  ) {}

  /**
   * Gets a value.
   * @param key The key.
   * @returns A promise that resolves with the value if found, undefined otherwise.
   */
  async get(key: string): Promise<T | undefined> {
    const transaction = this.db.transaction(this.tableName, 'readonly');
    const store = transaction.objectStore(this.tableName);
    return await idbRequest(store.get(key));
  }

  /**
   * Sets a value.
   * @param key The key.
   * @param value The value.
   * @returns A promise that resolves with the value.
   */
  async set(key: string, value: ValueTypeOmitId<T>): Promise<T> {
    const transaction = this.db.transaction(this.tableName, 'readwrite');
    const store = transaction.objectStore(this.tableName);

    const valueWithId = {
      ...value,
      id: key,
    }

    await idbRequest(store.put(valueWithId));

    return valueWithId as T;
  }

  /**
   * Adds a value. The key will be generated.
   * @param value The value.
   * @returns A promise that resolves with the value.
   */
  async add(value: ValueTypeOmitId<T>): Promise<T> {
    const transaction = this.db.transaction(this.tableName, 'readwrite');
    const store = transaction.objectStore(this.tableName);
    const key = v4();
    const valueWithId = {
      ...value,
      id: key,
    }

    await idbRequest(store.add(valueWithId));

    return valueWithId as T;
  }

  /**
   * Deletes a value.
   * @param key The key.
   * @returns A promise that resolves when the value is deleted.
   */
  async delete(key: string): Promise<void> {
    const transaction = this.db.transaction(this.tableName, 'readwrite');
    const store = transaction.objectStore(this.tableName);
    await idbRequest(store.delete(key));
  }

  /**
   * Clears the table.
   * @returns A promise that resolves when the table is cleared.
   */
  async clear(): Promise<void> {
    const transaction = this.db.transaction(this.tableName, 'readwrite');
    const store = transaction.objectStore(this.tableName);
    await idbRequest(store.clear());
  }

  /**
   * Lists values.
   * @param query The query.
   * @returns A promise that resolves with the values.
   */
  async list(query?: IDatabaseTableQuery): Promise<T[]> {
    try {
      const transaction = this.db.transaction(this.tableName, 'readonly');
      const store = transaction.objectStore(this.tableName);

      let request: IDBRequest<IDBCursorWithValue | null> | null = null;
      const direction = query?.orderBy?.direction === 'asc' ? 'next' : query?.orderBy?.direction === 'desc' ? 'prev' : void 0;
      if (query) {
        if (query.where) {
          const index = this.getIndexFromWhereQuery(store, query);
          const keyRange = this.getKeyRange(query.where);
          request = index.openCursor(keyRange, direction);
        } else if (query.orderBy?.key) {
          const index = this.getIndexFromStore(store, query.orderBy.key);
          request = index.openCursor(null, direction);
        }
      }

      if (!request) {
        request = store.openCursor();
      }

      const results: T[] = [];
      for await (const value of idbCursor<T>(request, query ?? {})) {
        results.push(value);
      }

      return results;
    } catch (e) {
      throw new Error('Invalid query');
    }
  }

  /**
   * Counts values.
   * @param query The query.
   * @returns A promise that resolves with the count.
   */
  async count(query?: IDatabaseTableQuery): Promise<number> {
    const transaction = this.db.transaction(this.tableName, 'readonly');
    const store = transaction.objectStore(this.tableName);

    // No query
    if (!query?.where) {
      return await idbRequest(store.count());
    }

    const index = this.getIndexFromWhereQuery(store, query);
    const keyRange = this.getKeyRange(query.where);

    // Query managed by a single key range
    if (query.where.operator !== '!=' &&
      query.where.operator !== 'in' &&
      query.where.operator !== 'not-in') {
      return await idbRequest(index.count(keyRange));
    }

    const complementaryCount = await this.getComplementaryCount(index, query.where)
    if (query.where.operator === 'in') {
      return complementaryCount;
    }

    return await idbRequest<number>(store.count()) - complementaryCount;
  }

  /**
   * Calculates the size of the table.
   * @returns A promise that resolves with the size.
   */
  async calculateSize(): Promise<number> {
    const transaction = this.db.transaction(this.tableName, 'readonly');
    const store = transaction.objectStore(this.tableName);
    const request = store.openCursor();

    let size = 0;
    for await (const value of idbCursor<T>(request, {})) {
      const objectSize = new Blob([JSON.stringify(value)]).size;
      size += objectSize;
    }

    return size;
  }

  /**
   * Gets a key range from a where query.
   * @param where The where query.
   * @returns The key range if needed for the query or undefined.
   * @ignore
   */
  private getKeyRange(where: IDatabaseTableQuery['where']): IDBKeyRange | undefined {
    if (!where?.operator || !where?.value) {
      throw new Error('Invalid query: where clause must have an operator and a value');
    }

    const { operator, value } = where;

    switch (operator) {
      case '==':
        return IDBKeyRange.only(value);
      case '>':
      case '>=':
        return IDBKeyRange.lowerBound(value, operator === '>');
      case '<':
      case '<=':
        return IDBKeyRange.upperBound(value, operator === '<');
      case 'between':
        return IDBKeyRange.bound(value[0], value[1]);
      case '!=':
      case 'not-in':
      case 'in':
        return void 0;
      default:
        throw new Error(`Invalid query: invalid operator: ${operator}`);
    }
  }

  /**
   * Gets an IndexedDB object store or index from a where query.
   * @param store The IndexedDB object store.
   * @param query The query.
   * @returns An IndexedDB object store or index.
   * @ignore
   */
  private getIndexFromWhereQuery(store: IDBObjectStore, query: IDatabaseTableQuery): IDBObjectStore | IDBIndex {
    if (!query.where?.key) {
      throw new Error('Invalid query: where clause must have a key');
    }


    if (store.keyPath === query.where.key) {
      return store;
    }

    return this.getIndexFromStore(store, query.where.key);
  }

  /**
   * Gets an IndexedDB index from an object store.
   * @param store The IndexedDB object store.
   * @param key The key.
   * @returns An IndexedDB index.
   * @ignore
   */
  private getIndexFromStore(store: IDBObjectStore, key: string): IDBIndex {
    try {
      return store.index(key);
    } catch (e) {
      throw new Error('Index not found');
    }
  }

  /**
   * Gets the complementary count for a where query.
   * @param index The IndexedDB index or object store.
   * @param where The where query.
   * @returns A promise that resolves with the complementary count.
   * @ignore
   */
  private async getComplementaryCount(index: IDBIndex | IDBObjectStore, where: IDatabaseTableQueryWhereValue | IDatabaseTableQueryWhereValues): Promise<number> {
    const complementaryWhere = { ...where };
    const values = Array.isArray(where.value) ? where.value : [where.value];
    complementaryWhere.operator = '==';

    let complementaryCount = 0;
    for (const value of values) {
      complementaryWhere.value = value;
      const complementaryKeyRange = this.getKeyRange(complementaryWhere);
      complementaryCount += await idbRequest<number>(index.count(complementaryKeyRange));
    }

    return complementaryCount;
  }
}
