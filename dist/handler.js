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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const index_1 = require("./index");
const aws_lambda_1 = __importDefault(require("@fastify/aws-lambda"));
let cachedHandler;
const IS_SERVERLESS = process.env.IS_SERVERLESS === 'true';
// This is defined at top-level — VALID EXPORT!
// checking
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (IS_SERVERLESS) {
        console.log('Running in serverless mode');
        if (!cachedHandler) {
            const app = yield (0, index_1.buildApp)();
            cachedHandler = (0, aws_lambda_1.default)(app);
        }
        return cachedHandler(event, context);
    }
    return {
        statusCode: 500,
        body: JSON.stringify({
            message: "This Lambda function is meant to be run in serverless mode only."
        })
    };
});
exports.handler = handler;
// Local dev runner
if (!IS_SERVERLESS) {
    const start = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const app = yield (0, index_1.buildApp)();
            yield app.listen({ port: 3000, host: '0.0.0.0' });
            console.log('Server listening on http://localhost:3000');
        }
        catch (err) {
            console.error('Error starting server:', err);
            process.exit(1);
        }
    });
    start();
}
