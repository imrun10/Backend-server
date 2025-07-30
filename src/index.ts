import { debug } from "console";
import Fastify from "fastify";
import { DebugController } from "./Controllers/DebugController";
import { TextController } from "./Controllers/TextController";

import formbody from '@fastify/formbody';
import { mainController } from "./Controllers/mainController";
import dotenv from 'dotenv';

export async function buildApp() {
  const fastify = Fastify();
  dotenv.config();


  await fastify.register(formbody); 



  new mainController(
    fastify,
    new TextController(fastify), // Pass the TextController instance
    new DebugController(fastify)  // Pass the DebugController instance
  );
  return fastify;
}

