import { getDatabase } from "./database.js";

type DocumentRow = {
  document_key: string;
  document_json: string;
  created_at: string;
  updated_at: string;
};

export class JsonCollection<T> {
  constructor(private readonly collection: string) {}

  all(): T[] {
    const rows = getDatabase()
      .prepare(
        `SELECT document_json
         FROM documents
         WHERE collection = ?
         ORDER BY created_at ASC, document_key ASC`,
      )
      .all(this.collection) as Array<Pick<DocumentRow, "document_json">>;

    return rows.map((row) => JSON.parse(row.document_json) as T);
  }

  get(key: string): T | null {
    const row = getDatabase()
      .prepare(
        `SELECT document_json
         FROM documents
         WHERE collection = ? AND document_key = ?`,
      )
      .get(this.collection, key) as Pick<DocumentRow, "document_json"> | undefined;

    return row ? JSON.parse(row.document_json) as T : null;
  }

  set(key: string, document: T): T {
    const now = new Date().toISOString();
    getDatabase()
      .prepare(
        `INSERT INTO documents (collection, document_key, document_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(collection, document_key) DO UPDATE SET
           document_json = excluded.document_json,
           updated_at = excluded.updated_at`,
      )
      .run(this.collection, key, JSON.stringify(document), now, now);

    return document;
  }

  insert(key: string, document: T): T {
    const now = new Date().toISOString();
    getDatabase()
      .prepare(
        `INSERT INTO documents (collection, document_key, document_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(this.collection, key, JSON.stringify(document), now, now);

    return document;
  }

  update(key: string, update: (current: T) => T): T | null {
    const current = this.get(key);
    if (!current) return null;
    return this.set(key, update(current));
  }

  delete(key: string): boolean {
    const result = getDatabase()
      .prepare(
        `DELETE FROM documents
         WHERE collection = ? AND document_key = ?`,
      )
      .run(this.collection, key);

    return result.changes > 0;
  }
}

