import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({db}: MigrateUpArgs): Promise<void> {
  // Keep the schema change and legacy-account adoption atomic on SQLite.
  await db.transaction(async transaction => {
    const columns = await transaction.all<{name:string}>(sql`PRAGMA table_info(users)`)
    if (!columns.some(column => column.name === 'role')) {
      await transaction.run(sql`ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user'`)
      // All legacy accounts previously had full access. Preserve that access once.
      await transaction.run(sql`UPDATE users SET role = 'admin'`)
    }
    // Also guard concurrent demotions/deletes at the database boundary.
    await transaction.run(sql`CREATE TRIGGER IF NOT EXISTS users_keep_admin_delete BEFORE DELETE ON users
      WHEN OLD.role = 'admin' AND (SELECT COUNT(*) FROM users WHERE role = 'admin') <= 1
      BEGIN SELECT RAISE(ABORT, 'At least one administrator must remain'); END`)
    await transaction.run(sql`CREATE TRIGGER IF NOT EXISTS users_keep_admin_update BEFORE UPDATE OF role ON users
      WHEN OLD.role = 'admin' AND NEW.role != 'admin' AND (SELECT COUNT(*) FROM users WHERE role = 'admin') <= 1
      BEGIN SELECT RAISE(ABORT, 'At least one administrator must remain'); END`)
  })
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Restore the verified pre-RBAC backup with the previous application version; automatic role removal is disabled.')
}
