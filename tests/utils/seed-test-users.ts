import db from "../../utils/db";
import createUser from "../../utils/createUser";

const TEST_USERS = [
  { username: "test", password: "1234" },
  { username: "testovich", password: "best password ever" },
];

export async function seedTestUsers() {
  for (const user of TEST_USERS) {
    try {
      await db.user.delete({ where: { username: user.username } });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const userDoesntExist = err && "code" in err && err.code === "P2025";
      if (!userDoesntExist) {
        throw err;
      }
    }

    await createUser({ username: user.username, password: user.password });
  }
}
