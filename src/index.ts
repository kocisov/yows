import helmet from "@fastify/helmet";
import websocket from "@fastify/websocket";
import chalk from "chalk";
import fastify from "fastify";
import cbGlob from "glob";
import { promisify } from "node:util";
import { version } from "../package.json";

console.log(chalk.yellowBright(`Yows v${version}`));

const glob = promisify(cbGlob);

const defaultEvents: Record<string, string> = {
  "_connect.ts": "_connect",
  "_disconnect.ts": "_disconnect",
  "_error.ts": "_error",
  "_message.ts": "_message",
};

async function setupFastifyServer(handlers: Record<string, Function>) {
  const app = fastify();

  await app.register(helmet);

  await app.register(websocket, {
    options: {
      clientTracking: false,
      maxPayload: 16 * 1024 * 1024,
    },
  });

  app.setNotFoundHandler((req, res) => {
    res.status(404).send("Not found");
  });

  app.route({
    url: "/*",
    method: "GET",

    handler(req, res) {
      res.send(`Yows v${version}`);
    },

    async wsHandler(conn, req) {
      conn.setEncoding("utf-8");
      conn.setDefaultEncoding("utf-8");

      const ws = conn.socket;

      handlers._connect?.(ws, req);

      ws.on("message", (event, isBinary) => {
        const data = JSON.parse(event.toString());
        handlers._message?.(ws, data, isBinary);
        handlers[data.t]?.(ws, data, isBinary);
      });

      ws.on("close", (code, reason) => {
        handlers._disconnect?.(ws, code, reason);
      });
    },
  });

  return app;
}

export async function run(args: Record<string, string | undefined>) {
  const port = Number(process.env.PORT ?? args.port ?? 3000);
  const eventsFolder = args.folder ?? "events";
  const handlers: Record<string, Function> = {};
  const cwd = process.cwd();

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

  const app = await setupFastifyServer(handlers);
  await app.listen({ host: "0.0.0.0", port });

  console.log(chalk.blueBright(`Listening on ws://localhost:${port}`));

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => {
      app.close();
    });
  });
}
