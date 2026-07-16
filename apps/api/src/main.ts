import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { StructuredLogger } from "./common/logging/structured-logger";

type RateLimitEntry = { count: number; resetAt: number };

function createRateLimitMiddleware(options: { windowMs: number; max: number; keyPrefix: string }) {
  const hits = new Map<string, RateLimitEntry>();

  return (request: { ip?: string; path?: string; originalUrl?: string }, response: { status: (code: number) => { json: (body: unknown) => void } }, next: () => void) => {
    const now = Date.now();
    const path = request.path ?? request.originalUrl ?? "";
    const key = `${options.keyPrefix}:${request.ip ?? "unknown"}:${path}`;
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (entry.count >= options.max) {
      response.status(429).json({ message: "Too many requests" });
      return;
    }

    entry.count += 1;
    next();
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new StructuredLogger() });
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>("API_PREFIX", "api");
  const webOrigin = config.getOrThrow<string>("WEB_ORIGIN");
  const allowedOrigins = webOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);

  app.setGlobalPrefix(apiPrefix);
  app.use(helmet());
  app.use(createRateLimitMiddleware({ windowMs: 60_000, max: 240, keyPrefix: "global" }));
  app.use(`/${apiPrefix}/auth/login`, createRateLimitMiddleware({ windowMs: 60_000, max: 10, keyPrefix: "login" }));
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = config.get<number>("PORT") ?? config.get<number>("API_PORT", 4000);
  await app.listen(port);
}

void bootstrap();
