#!/usr/bin/env node

import { fastify, type FastifyInstance } from 'fastify'
import { pino } from 'pino';
import cors from "@fastify/cors";
import routes from './src/routes.ts';
import { startJetstream } from './src/relay.ts';
import { CredentialManager, XRPC } from '@atcute/client';

export type AppContext = {
  logger: pino.Logger,
}

async function run(): Promise<AppContext> {
  const logger = pino();

  let bskyRpc: XRPC | undefined;
  if (process.env.BSKY_POST_PROXY_DID && process.env.BSKY_POST_PROXY_PASSWORD) {
    try {
      const manager = new CredentialManager({ service: 'https://bsky.social' });
      await manager.login({ identifier: process.env.BSKY_POST_PROXY_DID, password: process.env.BSKY_POST_PROXY_PASSWORD })
      bskyRpc = new XRPC({ handler: manager });
    } catch (err) {
      logger.error(`Logging into bsky rpc failed ${JSON.stringify(err)}`);
    }
  } else {
    logger.error('Could not log into bsky for proxy due to missing credentials');
  }
  
  const server = fastify();
  server.register(cors, { origin: "*" });
  server.register(import("@fastify/rate-limit"), {
    max: 300,
    timeWindow: "1m",
  });

  server.register(routes, { bskyRpc });

  const ctx = { logger };

  startJetstream(ctx);

  const port = 
    (process.env.PORT
    ? !isNaN(+process.env.PORT)
    ? +process.env.PORT
    : undefined
    : undefined) ?? 7825;

  server.listen({ port }, function (err, address) {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    logger.info(`Server listening at ${address}`);
  });

  const onCloseSignal = async () => {
    setTimeout(() => process.exit(1), 1000).unref();
    await close(server);
    process.exit();
  };

  process.on("SIGINT", onCloseSignal);
  process.on("SIGTERM", onCloseSignal);

  return ctx;
}

const close = (server: FastifyInstance) => {
  ctx.logger.info("sigint received, shutting down");
  return new Promise<void>((resolve) => {
    server.close(() => {
      ctx.logger.info("server closed");
      resolve();
    });
  });
};

export const ctx = await run();