import chalk from "chalk";
import cbGlob from "glob";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { WebSocketServer } from "ws";
import { version } from "../package.json";

console.log(chalk.yellowBright(`Yows v${version}`));

const glob = promisify(cbGlob);
const handlers: Record<string, Function> = {};
const eventsFolder = "events";
const cwd = process.cwd();
const defaultEvents: Record<string, string> = {
  "_connect.ts": "_connect",
  "_disconnect.ts": "_disconnect",
  "_error.ts": "_error",
};

export async function run(args: Record<string, string | undefined>) {
  const port = Number(process.env.PORT ?? args.port ?? 3000);

  const files = await glob(`{${eventsFolder},src/${eventsFolder}}/**/*.ts`).catch((error) => {
    console.error(error);
    process.exit(1);
  });

  for (const file of files) {
    const { default: event } = await import(`${cwd}/${file}`);
    const splitFile = file.split("/");
    const fileName = splitFile[splitFile.length - 1];
    const eventName = defaultEvents?.[fileName] ?? fileName.replace(".ts", "");
    handlers[eventName] = event;
  }

  const keys = Object.keys(handlers);
  console.log(chalk.greenBright(`Loaded ${keys.length} event handlers.`));
  console.log(chalk.blackBright(`(${keys.join(", ")})`));

  const httpServer = createServer((req, res) => {
    res.writeHead(200).end(`Yows v${version}`);
  });

  const websocketServer = new WebSocketServer({
    clientTracking: false,
    maxPayload: 16 * 1024 * 1024,
    server: httpServer,
  });

  websocketServer.on("connection", (ws, request) => {
    handlers._connect?.(ws, request);

    ws.on("message", (event, isBinary) => {
      const data = JSON.parse(event.toString());
      handlers._message?.(ws, data, isBinary);
      handlers[data.t]?.(ws, data, isBinary);
    });

    ws.on("close", (code, reason) => {
      handlers._disconnect?.(ws, code, reason);
    });
  });

  httpServer.listen(port);

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => {
      websocketServer.close();
      httpServer.close();
    });
  });

  console.log(chalk.blueBright(`Listening on ws://localhost:${port}`));
}
