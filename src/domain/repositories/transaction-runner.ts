/** Executes a callback inside a single atomic unit (SQLite transaction). */
export type TransactionRunner = <T>(work: () => Promise<T>) => Promise<T>;
