import { IDatabaseTableQuery, IKeyValueDatabaseMigrationHandle } from '@crewdle/web-sdk';

/**
 * Gets a promise from an IndexedDB request.
 * @param request The IndexedDB request.
 * @returns A promise that resolves with the result.
 * @ignore
 */
export function idbRequest<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets an async iterator from an IndexedDB cursor.
 * @param request The IndexedDB request.
 * @param query The query.
 * @returns An async iterator.
 * @ignore
 */
export async function* idbCursor<T>(request: IDBRequest<IDBCursorWithValue | null>, { limit = 0, offset = 0, where }: IDatabaseTableQuery): AsyncIterableIterator<T> {
  let count = 0;

  const { operator, key, value } = where ?? {};
  if (offset > 0) {
    await idbRequest(request);

    if (!request.result) {
      return;
    }

    request.result.advance(offset);
  }

  while (true) {
    await idbRequest(request);
    const { result } = request;

    if (!result) {
      break;
    }

    if (limit > 0 && count >= limit) {
      break;
    }

    if (key && value && (
      operator === '!=' && value === result.value[key] ||
      operator === 'not-in' && value.includes(result.value[key]) ||
      operator === 'in' && !value.includes(result.value[key])
    )) {
      result.continue();
      continue;
    }

    count += 1;
    yield result.value;
    result.continue();
  }
}
