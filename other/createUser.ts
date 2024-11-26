import bcrypt from "bcrypt";
import db from "./db";

const SALT_GENERATION_ROUNDS = 11;

type CreateUserArgs = {
  username: string;
  password: string;
};

export default async function createUser({ username, password }: CreateUserArgs) {
  const hashedPassword = bcrypt.hashSync(password, SALT_GENERATION_ROUNDS);
  const newUser = await db.user.create({
    data: {
      username: username,
      password: hashedPassword,
    },
  });
  return newUser;
}
