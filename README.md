# yows

> File Based Events WebSocket Server

> **Warning**
> This project is under development

## Installation

```bash
pnpm add yows
npm add yows
yarn add yows
```

## Usage

1. Create a folder called `events` either in the root of your project or in a `src` folder.

2. In `events` folder create a file called `eventName.ts` structured as this:

```ts
import type { WebSocket } from "ws";

type Data = {
  t: "eventName";
  text: string;
};

export default function eventName(ws: WebSocket, data: Data) {
  if (data.text === "hello") {
    ws.send(JSON.stringify({ t: "eventName", text: "world" }));
  }
}
```

3. In root of your project run `yows`

Optionally add start script to your `package.json`

```json
{
  "scripts": {
    "start": "yows"
  }
}
```

```bash
# Locally from dependencies
pnpm start

# If you installed `yows` globally
yows
```

4. Connect to `ws://localhost:3000` and send

```json
{
  "t": "eventName",
  "text": "hello"
}
```

5. You should receive

```json
{
  "t": "eventName",
  "text": "world"
}
```

## Default events

To use one of the default events, you can create a file prepended with `_` in `events` folder with a name of the event you want to use.

Currently usable default events are:

1. \_connect
2. \_disconnect
3. \_error
4. \_message

Example of a connection event:

```ts
import type { WebSocket } from "ws";
import { randomUUID } from "node:crypto";

type ExtendedWebSocket = WebSocket & {
  id: string;
};

export default function connect(ws: ExtendedWebSocket) {
  ws.id = randomUUID();
  ws.send(JSON.stringify({ t: "welcome", id: ws.id }));
}
```

## CLI Options

- -p, --port [port] Port which `yows` should listen on
