"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const app = (0, index_1.buildApp)();
// i will uncomment this when we are ready to move this to aws and then i will think of a solution to do serverless deploment and local development
/*
if (process.env.IS_SERVERLESS === 'true') {
  console.log('Running in serverless mode');
  module.exports.handler = serverless(app);
} else {
*/
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield app.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server listening on http://localhost:3000');
    }
    catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
});
start();
