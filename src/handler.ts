import { buildApp } from './index';
import awsLambdaFastify from '@fastify/aws-lambda';

let cachedHandler: any;

const IS_SERVERLESS = process.env.IS_SERVERLESS === 'true';

// This is defined at top-level — VALID EXPORT!
// checking
export const handler = async (event: any, context: any) => {
  if (IS_SERVERLESS) {
    console.log('Running in serverless mode');
    if (!cachedHandler) {
      const app = await buildApp();
      cachedHandler = awsLambdaFastify(app);
    }
    return cachedHandler(event, context);
  }

  return {
    statusCode: 500,
    body: JSON.stringify({
      message: "This Lambda function is meant to be run in serverless mode only."
    })
  };
};

// Local dev runner
if (!IS_SERVERLESS) {
  const start = async () => {
    try {
      const app = await buildApp();
      await app.listen({ port: 3000, host: '0.0.0.0' });
      console.log('Server listening on http://localhost:3000');
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  };

  start();
}
