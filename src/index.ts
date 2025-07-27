import { debug } from "console";
import Fastify from "fastify";
import { DebugController } from "./Controllers/DebugController";
import { TextController } from "./Controllers/TextController";

import formbody from '@fastify/formbody';
import { mainController } from "./Controllers/mainController";

export async function buildApp() {
  const fastify = Fastify();

  await fastify.register(formbody); // <== THIS IS KEY 🗝️

  new DebugController(fastify);
  new TextController(fastify);

  return fastify;
}

