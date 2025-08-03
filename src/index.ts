import { debug } from "console";
import Fastify from "fastify";
import { DebugController } from "./Controllers/DebugController";
import { TextController } from "./Controllers/TextController";

import formbody from '@fastify/formbody';
import { MainController } from "./Controllers/mainController";
import { AIController } from "./Controllers/AIController";
import dotenv from 'dotenv';

export async function buildApp() {
  const fastify = Fastify();
  dotenv.config();


  await fastify.register(formbody); 



  const aiController = new AIController(process.env.OPENAI_API_KEY!);
  const textController = new TextController(fastify);
  const debugController = new DebugController(fastify);

  new MainController(fastify, textController, debugController, aiController);

  return fastify;
}

