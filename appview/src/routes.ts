import type { FastifyInstance } from "fastify";
import * as t from "tschema";
import { userDbReadOnlyContext } from "./userDb/init.ts";
import type { Logger } from "pino";

const GetTagsSchema = t.object({
  repo: t.string()
});
type GetTagsI = t.Infer<typeof GetTagsSchema>;

const GetTagSchema = t.object({
  repo: t.string(),
  tag: t.string(),
});
type GetTagI = t.Infer<typeof GetTagSchema>;

const GetTaggedPostsSchema = t.object({
  repo: t.string(),
  tag: t.string(),
  limit: t.optional(t.integer({ minimum: 1, maximum: 100 })),
  cursor: t.optional(t.string()),
});
type GetTaggedPostsI = t.Infer<typeof GetTaggedPostsSchema>;

type RoutesOptions = {
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

  fastify.get<{ Querystring: GetTagI }>(
    '/xrpc/xyz.jeroba.tags.getTag',
    { schema: { querystring: GetTagSchema } },
    async (req, res) => {
      const { repo, tag } = req.query;
      const tagResult = await userDbReadOnlyContext(repo,
        async (db) => db
          .selectFrom('tags')
          .select(['rkey', 'title', 'description'])
          .where('rkey', '=', tag)
          .executeTakeFirst())
      if (tagResult) {
        res.code(200).send({ tag: tagResult });
      } else {
        res.code(400).send({ error: 'UnknownTag', message: 'Tag not found' });
      }
    }
  )

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
}

export default routes;