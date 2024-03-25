import { IDatabaseTableQuery } from '@crewdle/web-sdk-types';
/**
 * Gets a promise from an IndexedDB request.
 * @param request The IndexedDB request.
 * @returns A promise that resolves with the result.
 * @ignore
 */
export declare function idbRequest<T>(request: IDBRequest): Promise<T>;
/**
 * Gets an async iterator from an IndexedDB cursor.
 * @param request The IndexedDB request.
 * @param query The query.
 * @returns An async iterator.
 * @ignore
 */
export declare function idbCursor<T>(request: IDBRequest<IDBCursorWithValue | null>, { limit, offset, where }: IDatabaseTableQuery): AsyncIterableIterator<T>;
