import * as fs from 'fs/promises'
import * as oldSchema from './oldschema.ts';
import * as newSchema from './newschema.ts';
import { atUriToParts } from '../../src/util.ts';

const dbNames = (await fs.readdir('dbs')).filter(file => file.endsWith('.db'));

for (const dbName of dbNames) {
  console.log(`Migrating ${dbName}`);

  const oldDb = oldSchema.createUserDb(dbName, { readonly: true });
  const newDb = newSchema.createUserDb(dbName);
  await newSchema.migrateToLatest(newDb);

  console.log('Migrating tags');

  const tags = await oldDb
    .selectFrom('tags')
    .selectAll()
    .execute();

  if (tags.length) 
    await newDb
      .insertInto('tags')
      .values(tags)
      .execute();

  console.log('Migrating tagged');
  
  const tagged = (await oldDb
    .selectFrom('taggedRecords')
    .selectAll()
    .execute())
    .map(tagged => {
      const parts = atUriToParts(tagged.record);
      console.log(`AtURI ${tagged.record} | parts: ${parts?.did}/${parts?.collection}/${parts?.rkey}`);
      if (!parts) { 
        console.error(`${dbName}/tagged/${tagged.rkey}: invalid aturi ${tagged.record}`)
        return null;
      }
      return {
        rkey: tagged.rkey,
        cid: tagged.cid,
        updatedAt: tagged.updatedAt,
        indexedAt: tagged.indexedAt,
        tag: tagged.tag,
        recordDid: parts.did,
        recordCollection: parts.collection,
        recordRkey: parts.rkey,
      }
    })
    .filter(tagged => tagged)
    // Soundness: we've just filtered all null rows, but ts can't see that. Assert it.
    .map(tagged => tagged!);

  if (tagged.length)
    await newDb
      .insertInto('taggedRecords')
      .values(tagged)
      .execute();
}