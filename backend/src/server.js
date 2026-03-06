import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDb();
  app.listen(env.port, '0.0.0.0', () => {
  console.log(`API running on http://0.0.0.0:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
