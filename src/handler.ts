import { buildApp } from './index';
import serverless from 'serverless-http';

const app = buildApp();

// i will uncomment this when we are ready to move this to aws and then i will think of a solution to do serverless deploment and local development
/*
if (process.env.IS_SERVERLESS === 'true') {
  console.log('Running in serverless mode');
  module.exports.handler = serverless(app);
} else {
*/  
const start = async () => {
  try {
    const app = await buildApp(); // ✅ Await it here!
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server listening on http://localhost:3000');
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();