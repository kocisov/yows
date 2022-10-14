#!/usr/bin/env npx -y tsx@3.10.1

import { parseArgs } from "node:util";
import { run } from "../src";

run(
  parseArgs({
    options: {
      port: {
        type: "string",
        short: "p",
      },
      folder: {
        type: "string",
        short: "f",
      },
    },
    args: process.argv.slice(2),
  }).values
);
