// @ts-nocheck
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
        profile_cover_url VARCHAR(512) NULL,
        bio TEXT NULL,
        submission_analysis_mode VARCHAR(16) NOT NULL DEFAULT 'wrong_only',
        autosave_interval_seconds INT NOT NULL DEFAULT 30,
        oauth_provider VARCHAR(32) NULL,
        oauth_subject VARCHAR(191) NULL,
        is_admin TINYINT(1) NOT NULL DEFAULT 0,
        is_banned TINYINT(1) NOT NULL DEFAULT 0,
        records_public TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);

    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS uid VARCHAR(32) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(191) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_cover_url VARCHAR(512) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS submission_analysis_mode VARCHAR(16) NOT NULL DEFAULT 'wrong_only'");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS autosave_interval_seconds INT NOT NULL DEFAULT 30");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(32) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_subject VARCHAR(191) NULL");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) NOT NULL DEFAULT 0");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned TINYINT(1) NOT NULL DEFAULT 0");
    await connection.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS records_public TINYINT(1) NOT NULL DEFAULT 1");
    await connection.query("ALTER TABLE users MODIFY COLUMN submission_analysis_mode VARCHAR(16) NOT NULL DEFAULT 'wrong_only'");
    await connection.query("ALTER TABLE users MODIFY COLUMN records_public TINYINT(1) NOT NULL DEFAULT 1");

    await connection.query("UPDATE users SET uid = CONCAT('pre', id) WHERE uid IS NULL OR uid = ''");
    await connection.query(
      "UPDATE users SET autosave_interval_seconds = 30 WHERE autosave_interval_seconds NOT IN (0, 30, 60, 120, 300, 600)"
    );

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
      CREATE TABLE IF NOT EXISTS admin_tokens (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        token CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        created_by_uid VARCHAR(32) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_admin_tokens_token (token)
      )
    `);
    await connection.query("ALTER TABLE admin_tokens ADD COLUMN IF NOT EXISTS token CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL");
    await connection.query("ALTER TABLE admin_tokens MODIFY COLUMN token CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL");
    await connection.query("ALTER TABLE admin_tokens ADD COLUMN IF NOT EXISTS created_by_uid VARCHAR(32) NULL");
    await connection.query("ALTER TABLE admin_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS problemsets (
        id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(191) NOT NULL,
        description TEXT NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 120,
        question_config LONGTEXT NULL,
        created_by_uid VARCHAR(32) NULL,
        problemset_type VARCHAR(32) NOT NULL DEFAULT 'official_public',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);
    await connection.query("ALTER TABLE problemsets ADD COLUMN IF NOT EXISTS question_config LONGTEXT NULL");
    await connection.query("ALTER TABLE problemsets ADD COLUMN IF NOT EXISTS problemset_type VARCHAR(32) NOT NULL DEFAULT 'official_public'");

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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_uid VARCHAR(32) NOT NULL,
        problemset_id BIGINT UNSIGNED NOT NULL,
        mode VARCHAR(16) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'submitted',
        answers_json LONGTEXT NULL,
        results_json LONGTEXT NULL,
        score DECIMAL(8,2) NOT NULL DEFAULT 0,
        max_score DECIMAL(8,2) NOT NULL DEFAULT 0,
        remaining_seconds INT NULL,
        started_at DATETIME NULL,
        submitted_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_submissions_user_problem (user_uid, problemset_id),
        INDEX idx_submissions_user_status (user_uid, status),
        INDEX idx_submissions_problem (problemset_id)
      )
    `);
    await connection.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS answers_json LONGTEXT NULL");
    await connection.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS results_json LONGTEXT NULL");
    await connection.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS remaining_seconds INT NULL");
    await connection.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS started_at DATETIME NULL");
    await connection.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_at DATETIME NULL");
    await connection.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS mode VARCHAR(16) NOT NULL DEFAULT 'training'");
    await connection.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'submitted'");
    await connection.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS max_score DECIMAL(8,2) NOT NULL DEFAULT 0");
    await ensureUniqueIndex(connection, "idx_submissions_user_problem", "CREATE INDEX idx_submissions_user_problem ON submissions (user_uid, problemset_id)");
    await ensureUniqueIndex(connection, "idx_submissions_user_status", "CREATE INDEX idx_submissions_user_status ON submissions (user_uid, status)");
    await ensureUniqueIndex(connection, "idx_submissions_problem", "CREATE INDEX idx_submissions_problem ON submissions (problemset_id)");
  } finally {
    connection.release();
  }
}

