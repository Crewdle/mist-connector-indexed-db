import { ValueTypeOmitId, IDatabaseTableQuery, IValueType, IDatabaseLayout, IKeyValueDatabaseConnector, IKeyValueDatabaseMigrationHandle, IKeyValueDatabaseTableConnector } from '@crewdle/web-sdk';
/**
 * The indexedDB key-value database connector - Connect to an indexedDB database.
 * @category Connector
 */
export declare class IDBDatabaseConnector implements IKeyValueDatabaseConnector {
    private readonly dbKey;
    private readonly layout;
    /**
     * The indexedDB database.
     * @ignore
     */
    private db?;
    /**
     * The constructor.
     * @param dbKey The database key.
     * @param layout The database layout.
     */
    constructor(dbKey: string, layout: IDatabaseLayout);
    /**
     * Opens the database.
     * @param migration The migration function.
     * @returns A promise that resolves when the database is open.
     */
    open(migration: (db: IKeyValueDatabaseMigrationHandle) => void): Promise<void>;
    /**
     * Closes the database.
     */
    close(): void;
    /**
     * Checks if the table exists.
     * @param tableName The table name.
     * @returns True if the table exists, false otherwise.
     */
    hasTable(tableName: string): boolean;
    /**
     * Creates a table.
     * @param tableName The table name.
     */
    createTable(tableName: string): void;
    /**
     * Gets a table connector.
     * @param tableName The table name.
     * @returns A table connector.
     */
    getTableConnector<T extends IValueType>(tableName: string): IKeyValueDatabaseTableConnector<T>;
}
/**
 * The indexedDB database table connector - Connect to a table in an indexedDB database.
 * @category Connector
 */
export declare class IDBDatabaseTableConnector<T extends IValueType> implements IKeyValueDatabaseTableConnector<T> {
    private readonly db;
    private readonly tableName;
    /**
     * The constructor.
     * @param db The indexedDB database.
     * @param tableName The table name.
     */
    constructor(db: IDBDatabase, tableName: string);
    /**
     * Gets a value.
     * @param key The key.
     * @returns A promise that resolves with the value if found, undefined otherwise.
     */
    get(key: string): Promise<T | undefined>;
    /**
     * Sets a value.
     * @param key The key.
     * @param value The value.
     * @returns A promise that resolves with the value.
     */
    set(key: string, value: ValueTypeOmitId<T>): Promise<T>;
    /**
     * Adds a value. The key will be generated.
     * @param value The value.
     * @returns A promise that resolves with the value.
     */
    add(value: ValueTypeOmitId<T>): Promise<T>;
    /**
     * Deletes a value.
     * @param key The key.
     * @returns A promise that resolves when the value is deleted.
     */
    delete(key: string): Promise<void>;
    /**
     * Clears the table.
     * @returns A promise that resolves when the table is cleared.
     */
    clear(): Promise<void>;
    /**
     * Lists values.
     * @param query The query.
     * @returns A promise that resolves with the values.
     */
    list(query?: IDatabaseTableQuery): Promise<T[]>;
    /**
     * Counts values.
     * @param query The query.
     * @returns A promise that resolves with the count.
     */
    count(query?: IDatabaseTableQuery): Promise<number>;
    /**
     * Calculates the size of the table.
     * @returns A promise that resolves with the size.
     */
    calculateSize(): Promise<number>;
    /**
     * Gets a key range from a where query.
     * @param where The where query.
     * @returns The key range if needed for the query or undefined.
     * @ignore
     */
    private getKeyRange;
    /**
     * Gets an IndexedDB object store or index from a where query.
     * @param store The IndexedDB object store.
     * @param query The query.
     * @returns An IndexedDB object store or index.
     * @ignore
     */
    private getIndexFromWhereQuery;
    /**
     * Gets an IndexedDB index from an object store.
     * @param store The IndexedDB object store.
     * @param key The key.
     * @returns An IndexedDB index.
     * @ignore
     */
    private getIndexFromStore;
    /**
     * Gets the complementary count for a where query.
     * @param index The IndexedDB index or object store.
     * @param where The where query.
     * @returns A promise that resolves with the complementary count.
     * @ignore
     */
    private getComplementaryCount;
}
