import { debug } from "console";
import Fastify from "fastify";
import { DebugController } from "./Controllers/DebugController";
import { TextController } from "./Controllers/TextController";

export function buildApp() {
  const fastify = Fastify();


  let debugController = new DebugController(fastify);
  let textController = new TextController(fastify);
  

  return fastify;
}
