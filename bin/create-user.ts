import readline from "readline";
import { Writable } from "stream";
import { ArgumentParser } from "argparse";
import createUser from "../other/createUser";

async function main() {
  const parser = new ArgumentParser({
    description: "aibyss - create user",
  });

  parser.add_argument("username", { type: "str" });
  parser.add_argument("-p", "--password", { type: "str" });

  const args = parser.parse_args();

  if (!args.password) {
    args.password = await readlineQuestionMuted("Enter password: ");
    const passwordConfirmation = await readlineQuestionMuted("Confirm password: ");
    if (args.password !== passwordConfirmation) {
      console.error("Passwords do not match");
      process.exit(1);
    }
  }

  // create user
  await createUser({ username: args.username, password: args.password });
  console.log(`User ${args.username} created successfully`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

async function readlineQuestionMuted(question: string): Promise<string> {
  let muted = false;

  const mutableStdout = new Writable({
    write: function (chunk, encoding, callback) {
      if (!muted) {
        process.stdout.write(chunk, encoding);
      }
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true,
  });

  return new Promise((resolve) => {
    rl.question(question, function (password) {
      resolve(password);
      rl.close();
      process.stdout.write("\n");
    });

    muted = true;
  });
}
