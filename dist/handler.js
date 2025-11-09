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
// handler.ts
const index_1 = require("./index");
const aws_lambda_1 = __importDefault(require("@fastify/aws-lambda"));
const fs_1 = __importDefault(require("fs"));
let cachedHandler;
const IS_SERVERLESS = process.env.IS_SERVERLESS === 'true';
// ---- simple /tmp guard ----
const MEMORY_PATH = '/tmp/user-memory.json';
function ensureTmpMemoryFile() {
    try {
        if (!fs_1.default.existsSync(MEMORY_PATH)) {
            fs_1.default.writeFileSync(MEMORY_PATH, JSON.stringify({}), 'utf8');
            console.log('Initialized', MEMORY_PATH);
        }
    }
    catch (e) {
        console.error('Failed to init /tmp memory file:', e);
    }
}
// ---------------------------
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (IS_SERVERLESS) {
        console.log('Running in serverless mode');
        if (!cachedHandler) {
            // make sure the file exists before your app logic ever reads it
            ensureTmpMemoryFile();
            const app = yield (0, index_1.buildApp)();
            cachedHandler = (0, aws_lambda_1.default)(app);
        }
        return cachedHandler(event, context);
    }
    return {
        statusCode: 500,
        body: JSON.stringify({
            message: 'This Lambda function is meant to be run in serverless mode only.',
        }),
    };
});
exports.handler = handler;
// Local dev runner (unchanged)
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
