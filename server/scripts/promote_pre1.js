import { dbPool } from "../src/db.js";

async function main() {
  await dbPool.query("UPDATE users SET is_admin = 1, is_banned = 0 WHERE uid = 'pre1'");
  const [rows] = await dbPool.query(
    "SELECT id, uid, name, is_admin, is_banned FROM users WHERE uid = 'pre1' LIMIT 1"
  );
  // eslint-disable-next-line no-console
  console.log(rows[0] ?? null);
  await dbPool.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
