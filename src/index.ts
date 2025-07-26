import { debug } from "console";
import Fastify from "fastify";
import { DebugController } from "./Controllers/DebugController";
import { TextController } from "./Controllers/TextController";

export function buildApp() {

  // Sets up a Fastify instance similiar to express but much faster with built-in support for async/await
  const fastify = Fastify();

  // controllers are self contained and handle their own routes
  // this allows for better separation of concerns and easier testing
 
  // playground controller to do different things and can be used for testing as well  
  let debugController = new DebugController(fastify);

  let textController = new TextController(fastify);
  
  

  return fastify;
}
