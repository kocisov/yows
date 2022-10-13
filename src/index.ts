import chalk from "chalk";
import { version } from "../package.json";

console.log(chalk.yellowBright(`Yows v${version}`));

export async function run(args: Record<string, string | undefined>) {
  const port = Number(process.env.PORT ?? args.port ?? 3000);
}
