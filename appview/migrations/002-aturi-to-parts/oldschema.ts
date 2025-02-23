import SqliteDb from 'libsql';
import { CompiledQuery, Kysely, Migrator, sql, SqliteDialect, type ColumnType, type Migration, type MigrationProvider } from 'kysely'

export type UserDatabaseSchema = {
  tags: TagTable,
  taggedRecords: TaggedRecordTable,
}

export type TagTable = {
  rkey: ColumnType<string, string, never>,
  cid: string,
  title: string,
  description: string | undefined,
  updatedAt: number,
  indexedAt: ColumnType<number, number, never>,
}

export type TaggedRecordTable = {
  rkey: ColumnType<string, string, never>,
  cid: string,
  tag: string,
  record: ColumnType<string, string, never>,
  updatedAt: number,
  indexedAt: ColumnType<number, number, never>,
}

const migrations: Record<string, Migration> = {};

const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};

migrations['001'] = {
  async up(db) {
    await db.schema
      .createTable('tags')
      .addColumn('rkey', 'text', (col) => col.notNull().primaryKey())
      .addColumn('cid', 'text', (col) => col.notNull())
      .addColumn('title', 'text', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('updatedAt', 'date', (col) => col.notNull())
      .addColumn('indexedAt', 'date', (col) => col.notNull())
      .execute();
    
    await db.schema
      .createTable('taggedRecords')
      .addColumn('rkey', 'text', (col) => col.notNull().primaryKey())
      .addColumn('cid', 'text', (col) => col.notNull())
      .addColumn('tag', 'text', (col) => col.notNull().references('tags.rkey').onDelete('cascade'))
      .addColumn('record', 'text', (col) => col.notNull())
      .addColumn('updatedAt', 'date', (col) => col.notNull())
      .addColumn('indexedAt', 'date', (col) => col.notNull())
      .execute();

    await db.schema
      .createIndex('taggedRecords-tag')
      .on('taggedRecords')
      .column('tag')
      .execute();
    
    await db.schema
      .createIndex('taggedRecords-indexedAt')
      .on('taggedRecords')
      .expression(sql`indexedAt DESC`)
      .execute();
  },
  async down(db) {
    await db.schema.dropIndex('taggedRecords-indexedAt').execute();
    await db.schema.dropIndex('taggedRecords-tag').execute();
    await db.schema.dropTable('taggedRecords').execute();
    await db.schema.dropTable('tags').execute();
  }
}

export const createUserDb = (did: string, options?: SqliteDb.Options): UserDatabase => {
  const db = new Kysely<UserDatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(`dbs/${did}`, options),
    }),
  });
  //db.executeQuery(CompiledQuery.raw('PRAGMA journal_mode = WAL'));
  db.executeQuery(CompiledQuery.raw('PRAGMA foreign_keys = ON'));
  return db;
};

export const migrateToLatest = async (db: UserDatabase) => {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
};

export async function userDbContext<T>(did:string, action: (db: UserDatabase) => Promise<T>): Promise<T> {
  const db = createUserDb(did);
  await migrateToLatest(db);
  const res = await action(db);
  await db.destroy();
  return res;
}

export async function userDbReadOnlyContext<T>(did:string, action: (db: UserDatabase) => Promise<T>): Promise<T | null> {
  let db: UserDatabase;
  try {
    db = createUserDb(did, { fileMustExist: true, readonly: true });
  } catch {
    return null;
  }
  await migrateToLatest(db);
  const res = await action(db);
  db.destroy();
  return res;
}

export type UserDatabase = Kysely<UserDatabaseSchema>;