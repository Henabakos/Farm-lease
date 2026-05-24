// ============================================================================
// Farm Lease — API entrypoint.
//
// Composition root:
//   1. Load + validate env (side-effect of importing config/env.js).
//   2. Build the Express app with the production middleware stack.
//   3. Mount versioned `/api/v1/*` routes, with `/api/*` aliasing for
//      backwards compatibility with the existing frontend contract.
//   4. Boot Socket.IO over the same HTTP server with the Redis adapter.
//   5. Seed RBAC defaults + start the outbox dispatcher.
//   6. Wire graceful shutdown.
//
// What this file does NOT do:
//   • No business logic.
//   • No database queries directly — those live in services/repositories.
//   • No Supabase client — Supabase has been completely removed.
// ============================================================================

import express from "express";
import http from "node:http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import pino from "pino";

import { env, isProd } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { prisma, disconnectPrisma } from "./db/prisma.js";
import { disconnectRedis } from "./db/redis.js";

import { requestId } from "./middleware/requestId.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { auditLogger } from "./middleware/auditLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

import { registerHealthRoutes } from "./shared/health.js";
import { initSocket } from "./realtime/socket.js";
import { seedAndLoadPermissions } from "./modules/rbac/seed.js";
import {
    startOutboxDispatcher,
    stopOutboxDispatcher,
} from "./events/outboxDispatcher.js";
import { attachQueueLoggers, closeQueues } from "./queues/index.js";

import { makeStubRouter } from "./modules/_stub.js";
import { attachBroadcaster } from "./realtime/broadcaster.js";

import authRouter            from './modules/auth/auth.routes.js';
import usersRouter           from './modules/users/users.routes.js';
import clustersRouter        from './modules/clusters/clusters.routes.js';
import proposalsRouter       from './modules/proposals/proposals.routes.js';
import negotiationsRouter    from './modules/negotiations/negotiations.routes.js';
import agreementsRouter      from './modules/agreements/agreements.routes.js';
import paymentsRouter        from './modules/payments/payments.routes.js';
import messagingRouter       from './modules/messaging/messaging.routes.js';
import notificationsRouter  from './modules/notifications/notifications.routes.js';
import meetingsRouter        from './modules/meetings/meetings.routes.js';
import analyticsRouter       from './modules/analytics/analytics.routes.js';
import adminRouter           from './modules/admin/admin.routes.js';
import geospatialRouter      from './modules/geospatial/geospatial.routes.js';
import contractTemplatesRouter from './modules/contract-templates/contract-templates.routes.js';
import featureFlagsRouter    from './modules/feature-flags/feature-flags.routes.js';
import aiRouter              from './modules/ai/ai.routes.js';
import filesRouter           from './modules/files/files.routes.js';
import plotsRouter           from './modules/plots/plots.routes.js';
import resourcesRouter       from './modules/resources/resources.routes.js';
import providerRequestsRouter from './modules/provider-requests/provider-requests.routes.js';

// ----------------------------------------------------------------------------
// App factory — exported for tests so we can mount the app without binding
// to a port.
// ----------------------------------------------------------------------------
export function buildApp() {
    const app = express();

    // Trust the first proxy hop (nginx, ALB, etc.) so req.ip reflects the real
    // client. Tighten this in prod once the topology is fixed.
    app.set("trust proxy", 1);
    app.disable("x-powered-by");

    // ---- Core middleware ---------------------------------------------------
    app.use(requestId());
    app.use(
        pinoHttp({
            logger: pinoHttpLogger,
            genReqId: (req) => req.id,
            customLogLevel: (_req, res, err) => {
                if (err || res.statusCode >= 500) return "error";
                if (res.statusCode >= 400) return "warn";
                return "info";
            },
            serializers: {
                req: (req) => ({
                    id: req.id,
                    method: req.method,
                    url: req.url,
                }),
                res: (res) => ({ statusCode: res.statusCode }),
            },
        }),
    );

    app.use(
        helmet({
            contentSecurityPolicy: isProd ? undefined : false, // dev: relaxed for HMR
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }),
    );
    app.use(
        cors({
            origin: env.CLIENT_URL,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        }),
    );
    app.use(compression());
    app.use(express.json({ limit: "2mb" }));
    app.use(express.urlencoded({ extended: true, limit: "2mb" }));

    // Global rate limit — narrower limits on /auth and /ai are applied at the
    // router level inside those modules.
    app.use("/api", globalLimiter);

    // Audit (writes are fire-and-forget; placed AFTER auth so req.user is set
    // where available — auth itself runs inside individual route modules).
    app.use(auditLogger());

    // ---- Health probes ----------------------------------------------------
    registerHealthRoutes(app);

    // ---- API routes (versioned) ------------------------------------------
    // Each module is currently stubbed; Phase 4 fills /auth, Phase 5 fills the
    // rest one by one. The frontend contract remains stable: requests succeed
    // once the module ships, otherwise return 501 with a clear `code`.
    const api = express.Router();

  api.use('/auth',                 authRouter);
  api.use('/users',                usersRouter);
  api.use('/clusters',             clustersRouter);
  api.use('/proposals',            proposalsRouter);
  api.use('/negotiations',         negotiationsRouter);
  api.use('/agreements',           agreementsRouter);
  api.use('/payments',             paymentsRouter);
  api.use('/messages',             messagingRouter);
  api.use('/notifications',        notificationsRouter);
  api.use('/meetings',             meetingsRouter);
  api.use('/analytics',            analyticsRouter);
  api.use('/admin',                adminRouter);
  api.use('/geospatial',           geospatialRouter);
  api.use('/plots',                plotsRouter);
  api.use('/resources',            resourcesRouter);
  api.use('/provider-requests',    providerRequestsRouter);
  api.use('/payment-verification', makeStubRouter('payment-verification'));
  api.use('/contract-templates',   contractTemplatesRouter);
  api.use('/multi-cluster',        makeStubRouter('multi-cluster'));
  api.use('/ai',                   aiRouter);
  api.use('/feature-flags',        featureFlagsRouter);
  api.use('/files',                filesRouter);

    // Mount at both /api/v1 (canonical) and /api (legacy alias).
    app.use("/api/v1", api);
    app.use("/api", api);

    // ---- 404 + error handlers (must be last) -----------------------------
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

// ----------------------------------------------------------------------------
// Bootstrap
// ----------------------------------------------------------------------------
async function bootstrap() {
    // Fail fast if Postgres is unreachable.
    await prisma.$connect();
    logger.info("postgres connected");

    await seedAndLoadPermissions();

    const app = buildApp();
    const server = http.createServer(app);
    const io = initSocket(server);
    app.set("io", io); // services that need to broadcast can read via app.get('io')
    attachBroadcaster(io);

    attachQueueLoggers();
    startOutboxDispatcher();

    await new Promise((resolve) => server.listen(env.PORT, resolve));
    logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        "farm-lease api listening",
    );

    // ---- Graceful shutdown ----------------------------------------------
    const shutdown = async (signal) => {
        logger.info({ signal }, "shutdown initiated");
        server.close();
        await stopOutboxDispatcher();
        await closeQueues();
        await disconnectPrisma();
        await disconnectRedis();
        logger.info("shutdown complete");
        process.exit(0);
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    process.on("unhandledRejection", (reason) => {
        logger.error({ reason }, "unhandled promise rejection");
    });
    process.on("uncaughtException", (err) => {
        logger.fatal({ err }, "uncaught exception — exiting");
        process.exit(1);
    });

    return { app, server, io };
}

// Run only when this file is the program entrypoint (not when imported by tests).
const isEntry =
    import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` ||
    process.argv[1]?.endsWith("server/index.js") ||
    process.argv[1]?.endsWith("server\\index.js");

if (isEntry) {
    bootstrap().catch((err) => {
        logger.fatal({ err }, "bootstrap failed");
        process.exit(1);
    });
}
