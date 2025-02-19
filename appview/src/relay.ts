import { Jetstream } from "@skyware/jetstream";
import type { AppContext } from "../index.ts";
import { userDbContext } from "./userDb/init.ts";
import { countGrapheme } from 'unicode-segmenter';
import fs from "node:fs";
import * as TID from '@atcute/tid';
import { atUriToParts, partsToAtUri, type AtUriParts } from "./util.ts";

export function startJetstream(ctx: AppContext) {
  let intervalID: NodeJS.Timeout;
  let cursorFile: string | undefined;
  try {
    cursorFile = fs.readFileSync("cursor.txt", "utf8");
  } catch { }
  if (cursorFile) ctx.logger.info(`Initiate jetstream at cursor ${cursorFile}`);

  const jetstream = new Jetstream({
    wantedCollections: ['xyz.jeroba.tags.*'],
    endpoint: 'wss://jetstream2.us-east.bsky.network/subscribe',
    cursor: cursorFile ? Number(cursorFile) - 5 * 1000000 : undefined,
  });

  jetstream.on("error", (err) => ctx.logger.error(err));
  jetstream.on("close", () => clearInterval(intervalID));

  jetstream.on("open", () => {
    intervalID = setInterval(() => {
      if (jetstream.cursor) {
        fs.writeFile("cursor.txt", jetstream.cursor.toString(), (err) => {
          if (err) console.log(err);
        });
      }
    }, 60000);
  });

  jetstream.on('xyz.jeroba.tags.tag', async (event) => {
    try {
      if (event.commit.operation !== 'delete') {
        const title = event.commit.record.title;
        const description = event.commit.record.description;
        if (!TID.validate(event.commit.rkey)) return;
        if (title && (title.length > 3000 || countGrapheme(title) > 300)) return;
        if (description && (description.length > 12000 || countGrapheme(description) > 1200)) return;
      }
      await userDbContext(event.did, async (db) => {
        if (event.commit.operation === 'delete') {
          await db
            .deleteFrom('tags')
            .where('rkey', '=', event.commit.rkey)
            .executeTakeFirst();
          ctx.logger.info(`Deleted tag ${event.commit.rkey} from ${event.did}`);
        } else {
          const exists = await db
            .selectFrom('tags')
            .where('rkey', '=', event.commit.rkey)
            .select(['rkey'])
            .executeTakeFirst();
          if (!exists) {
            const res = await db
              .insertInto('tags')
              .values({
                rkey: event.commit.rkey,
                cid: event.commit.cid,
                title: event.commit.record.title,
                description: event.commit.record.description,
                updatedAt: Date.now(),
                indexedAt: Date.now(),
              })
              .executeTakeFirst();
            if (res.numInsertedOrUpdatedRows) {
              ctx.logger.info(`Inserted tag ${event.commit.rkey} for ${event.did} on ${event.commit.operation}`)
            } else {
              ctx.logger.warn(`Failed to insert tag ${event.commit.rkey} for ${event.did} on ${event.commit.operation}`);
            }
          } else {
            const res = await db
              .updateTable('tags')
              .where('rkey', '=', event.commit.rkey)
              .set({
                cid: event.commit.cid,
                title: event.commit.record.title,
                description: event.commit.record.description,
                updatedAt: Date.now(),
              })
              .executeTakeFirst();
            if (res.numUpdatedRows) {
              ctx.logger.info(`Updated tag ${event.commit.rkey} for ${event.did} on ${event.commit.operation}`)
            } else {
              ctx.logger.warn(`Failed to update tag ${event.commit.rkey} for ${event.did} on ${event.commit.operation}`);
            }
          }
        }
      })
    } catch (err) {
      ctx.logger.error(err, JSON.stringify(event));
    }
  });

  jetstream.on('xyz.jeroba.tags.tagged', async (event) => {
    let atUriParts: AtUriParts | undefined;
    if (event.commit.operation !== 'delete') {
      if (!TID.validate(event.commit.rkey)) return;
      atUriParts = atUriToParts(event.commit.record.record);
      if (!atUriParts) return;
    }
    try {
      await userDbContext(event.did, async (db) => {
        if (event.commit.operation === 'delete') {
          await db
            .deleteFrom('taggedRecords')
            .where('rkey', '=', event.commit.rkey)
            .executeTakeFirst();
          ctx.logger.info(`Deleted tagged record ${event.commit.rkey} from ${event.did}`);
        } else {
          
          const exists = await db
            .selectFrom('taggedRecords')
            .where('rkey', '=', event.commit.rkey)
            .select(['rkey'])
            .executeTakeFirst();
          if (!exists) {
            const res = await db
              .insertInto('taggedRecords')
              .values({
                rkey: event.commit.rkey,
                cid: event.commit.cid,
                tag: event.commit.record.tag,
                // This closure is ran immediately when the userDbContext is called, this should never be undefined
                record: partsToAtUri(atUriParts!),
                updatedAt: Date.now(),
                indexedAt: Date.now(),
              })
              .executeTakeFirst();
            if (res.numInsertedOrUpdatedRows) {
              ctx.logger.info(`Inserted tagged record ${event.commit.rkey} for ${event.did} on ${event.commit.operation}`)
            } else {
              ctx.logger.warn(`Failed to insert tagged record ${event.commit.rkey} for ${event.did} on ${event.commit.operation}`);
            }
          } else {
            const res = await db
              .updateTable('taggedRecords')
              .where('rkey', '=', event.commit.rkey)
              .set({
                cid: event.commit.cid,
                tag: event.commit.record.tag,
                updatedAt: Date.now(),
              })
              .executeTakeFirst();
            if (res.numUpdatedRows) {
              ctx.logger.info(`Updated tagged record ${event.commit.rkey} for ${event.did} on ${event.commit.operation}`)
            } else {
              ctx.logger.warn(`Failed to update tagged record ${event.commit.rkey} for ${event.did} on ${event.commit.operation}`);
            }
          }
        }
      })
    } catch (err) {
      ctx.logger.error(err, JSON.stringify(event));
    }
  });

  jetstream.start();
}