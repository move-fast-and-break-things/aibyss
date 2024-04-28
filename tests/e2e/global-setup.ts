import child_process from "node:child_process";
import { seedTestUsers } from "../utils/seed-test-users";

async function globalSetup() {
  console.log("initializing the database...");
  child_process.execSync("npx prisma migrate reset --force --skip-generate", { stdio: "inherit" });

  console.log("seeding the test users...");
  seedTestUsers();
}

export default globalSetup;
