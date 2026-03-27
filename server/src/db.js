import mysql from "mysql2/promise";
import { env } from "./env.js";

export const dbPool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function pingDb() {
  const connection = await dbPool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

async function ensureUniqueIndex(connection, indexName, ddl) {
  try {
    await connection.query(ddl);
  } catch (err) {
    const message = String(err?.message ?? "");
    if (message.includes("Duplicate key name") && message.includes(indexName)) {
      return;
    }
    throw err;
  }
}

export async function ensureUserSchema() {
  const connection = await dbPool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        uid VARCHAR(32) NULL,
        name VARCHAR(64) NOT NULL,
        email VARCHAR(191) NULL,
        password_hash VARCHAR(255) NULL,
        avatar_url VARCHAR(255) NULL,
        oauth_provider VARCHAR(32) NULL,
        oauth_subject VARCHAR(191) NULL,
        is_admin TINYINT(1) NOT NULL DEFAULT 0,
        is_banned TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);

    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS uid VARCHAR(32) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(191) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(32) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_subject VARCHAR(191) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) NOT NULL DEFAULT 0");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned TINYINT(1) NOT NULL DEFAULT 0");

    await connection.query("UPDATE users SET uid = CONCAT('pre', id) WHERE uid IS NULL OR uid = ''");

    await ensureUniqueIndex(connection, "users_email_unique", "CREATE UNIQUE INDEX users_email_unique ON users (email)");
    await ensureUniqueIndex(connection, "users_uid_unique", "CREATE UNIQUE INDEX users_uid_unique ON users (uid)");
    await ensureUniqueIndex(
      connection,
      "users_oauth_unique",
      "CREATE UNIQUE INDEX users_oauth_unique ON users (oauth_provider, oauth_subject)"
    );

    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        \`key\` VARCHAR(64) NOT NULL,
        \`value\` TEXT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`key\`)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS problemsets (
        id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(191) NOT NULL,
        description TEXT NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 120,
        question_config LONGTEXT NULL,
        created_by_uid VARCHAR(32) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);
    await connection.query("ALTER TABLE problemsets ADD COLUMN IF NOT EXISTS question_config LONGTEXT NULL");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        problemset_id BIGINT UNSIGNED NOT NULL,
        question_index INT NOT NULL,
        question_type VARCHAR(16) NOT NULL DEFAULT 'option',
        stem TEXT NOT NULL,
        input_placeholder TEXT NULL,
        options_json JSON NOT NULL,
        score DECIMAL(8,2) NOT NULL DEFAULT 1.50,
        answer VARCHAR(64) NOT NULL,
        analysis TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_problem_question (problemset_id, question_index)
      )
    `);
    await connection.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(16) NOT NULL DEFAULT 'option'");
    await connection.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS input_placeholder TEXT NULL");
  } finally {
    connection.release();
  }
}
