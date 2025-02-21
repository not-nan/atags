import type { FastifyInstance } from "fastify";
import * as t from "tschema";
import { userDbReadOnlyContext } from "./userDb/init.ts";
import { CredentialManager } from "@atcute/client";
import { Readable } from "node:stream";
import type { Logger } from "pino";
import { atUriToParts } from "./util.ts";

const GetTagsSchema = t.object({
  repo: t.string()
});
type GetTagsI = t.Infer<typeof GetTagsSchema>;

const GetTaggedPostsSchema = t.object({
  repo: t.string(),
  tag: t.string(),
  limit: t.optional(t.integer({ minimum: 1, maximum: 100 })),
  cursor: t.optional(t.string()),
});
type GetTaggedPostsI = t.Infer<typeof GetTaggedPostsSchema>;

const ProxyBskyGetPostsSchema = t.object({
  uris: t.array(t.string(), { minItems: 1, maxItems: 25 }),
});
type ProxyBskyGetPostsI = t.Infer<typeof ProxyBskyGetPostsSchema>;

type RoutesOptions = {
  bskyManager: CredentialManager | undefined,
  logger: Logger
}

function routes(fastify: FastifyInstance, options: RoutesOptions) {
  fastify.get<{ Querystring: GetTagsI }>(
    '/xrpc/xyz.jeroba.tags.getTags',
    { schema: { querystring: GetTagsSchema } },
    async (req, res) => {
      const { repo } = req.query;
      const tags = await userDbReadOnlyContext(repo,
        async (db) => db
          .selectFrom('tags')
          .orderBy('title asc')
          .select(['rkey', 'title', 'description'])
          .execute()) ?? [];
      res.code(200).send({ tags });
    }
  );

  fastify.get<{ Querystring: GetTaggedPostsI }>(
    '/xrpc/xyz.jeroba.tags.getTaggedPosts',
    { schema: { querystring: GetTaggedPostsSchema } },
    async (req, res) => {
      const { repo, tag, limit, cursor } = req.query;
      const taggedPosts = await userDbReadOnlyContext(repo,
        (db) => {
          let query = db
            .selectFrom('taggedRecords')
            .where('tag', '=', tag);
          if (cursor && !isNaN(+cursor)) {
            query = query.where('indexedAt', '<', +cursor)
          }
          return query
            .orderBy('indexedAt desc')
            .limit((limit ?? 50) + 1)
            .select(['rkey', 'cid', 'record', 'indexedAt'])
            .execute();
        }
      ) ?? [];
      const newCursor = taggedPosts.length === (limit ?? 50) + 1
        ? taggedPosts[taggedPosts.length - 2].indexedAt
        : undefined;
      if (taggedPosts.length === (limit ?? 50) + 1) taggedPosts.pop();
      res.code(200).send({ taggedPosts, cursor: newCursor?.toString() });
    }
  );

  fastify.get<{ Querystring: ProxyBskyGetPostsI }>(
    '/xrpc/app.bsky.feed.getPosts',
    { schema: { querystring: ProxyBskyGetPostsSchema } },
    async (req, res) => {
      if (!options.bskyManager) {
        res.code(500).send();
        return;
      }

      const wrongUri = req.query.uris.findIndex(uri => !atUriToParts(uri));
      if (wrongUri !== -1) {
        res.code(400).type('application/json').send(JSON.stringify({ 
          error: 'InvalidRequest', 
          message: `Error: uris/${wrongUri} must be a valid at-uri`
        }));
        return;
      }

      const mapped = req.query.uris.map(uri => `uris=${uri}`);
      let result = await options.bskyManager.fetch(
        `${options.bskyManager.serviceUrl}/xrpc/app.bsky.feed.getPosts?${mapped.join('&')}`, {
        headers: {
          Authorization: `Bearer ${options.bskyManager.session?.accessJwt}`
        }
      });

      if (result.status === 400) {
        const response: any = await result.json();
        if (!(typeof response === 'object' && response?.error === 'ExpiredToken')) {
          res.code(400).type('application/json').send(response);
          return;
        }

        const refreshResult = await options.bskyManager.fetch(`${options.bskyManager.serviceUrl}/xrpc/com.atproto.server.refreshSession`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${options.bskyManager.session?.refreshJwt}`
          }
        });

        if (!refreshResult.ok) {
          options.logger.error(`Session refresh failed ${refreshResult.status} ${await refreshResult.text()}`);
          res.status(500).send();
          return;
        }

        const newAuth = await refreshResult.json();
        // TODO: maybe validate
        await options.bskyManager.resume(newAuth as any);

        result = await options.bskyManager.fetch(
          `${options.bskyManager.serviceUrl}/xrpc/app.bsky.feed.getPosts?${mapped.join('&')}`, {
          headers: {
            Authorization: `Bearer ${options.bskyManager.session?.accessJwt}`
          }
        });
      }

      if (!result.body) {
        res.status(result.status).send();
      } else {
        res.status(result.status).type(result.headers.get('content-type') ?? 'text/plain');
        return Readable.fromWeb(result.body);
      }
    }
  );
}

export default routes;