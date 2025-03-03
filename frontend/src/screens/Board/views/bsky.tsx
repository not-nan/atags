import { RecordView, ToHydrateView } from ".";
import { AtUriParts, atUriToParts, partsToAtUri, ReplaceAtUri } from "../../../lib/util";
import NotFound from "./NotFound";
import { AppBskyEmbedImages, AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { Match, Switch } from "solid-js";
import { simpleFetchHandler, XRPC } from "@atcute/client";

const Render = (props: { post: ReplaceAtUri<AppBskyFeedDefs.PostView, 'uri'> }) => {
  const record = props.post.record as AppBskyFeedPost.Record;
  return (
    <div class="grow">
      <div class="flex h-11">
       <img class="rounded-full aspect-square h-11 w-11" src={ props.post.author.avatar } />
        <div class="flex flex-col shrink ml-2">
          <p class="text-base dark:text-light-pink">{ props.post.author.displayName }</p>
          <p class="text-gray-500 text-sm">@{ props.post.author.handle }</p>
        </div>
      </div>
      <p class="my-2">{record.text}</p>
      <Switch>
        <Match when={props.post.embed?.$type === 'app.bsky.embed.images#view'}>
          <ImageEmbed images={(props.post.embed as AppBskyEmbedImages.View).images} />
        </Match>
      </Switch>
    </div>
  )
}

const ImageEmbed = (props: { images: AppBskyEmbedImages.ViewImage[] }) => {
  return (
    <div class="flex">
      <Switch>
        <Match when={props.images.length === 1}>
          <Image class="h-full rounded-md" image={props.images[0]} />
        </Match>
        <Match when={props.images.length === 2}>
          <Image class="rounded-l-md mr-0.5 grow shrink basis-0" image={props.images[0]} />
          <Image class="rounded-r-md ml-0.5 grow shrink basis-0" image={props.images[1]} />
        </Match>
        <Match when={props.images.length === 3}>
          <Image class="grow shrink basis-0 rounded-l-md mr-0.5" image={props.images[0]} />
          <div class="grow shrink basis-0 flex flex-col ml-0.5">
            <Image class="rounded-tr-md mb-0.5" image={props.images[1]} />
            <Image class="rounded-br-md mt-0.5" image={props.images[2]} />
          </div>
        </Match>
        <Match when={props.images.length === 4}>
          <div class="flex flex-col mr-0.5 grow shrink basis-0">
            <Image class="h-full rounded-tl-md mb-0.5" image={props.images[0]} />
            <Image class="h-full rounded-bl-md mt-0.5" image={props.images[1]} />
          </div>
          <div class="flex flex-col ml-0.5 grow shrink basis-0">
            <Image class="h-full rounded-tr-md mb-0.5" image={props.images[2]} />
            <Image class="h-full rounded-br-md mt-0.5" image={props.images[3]} />
          </div>
        </Match>
      </Switch>
    </div>
  );
}

const Image = (props: { image: AppBskyEmbedImages.ViewImage, class?: string }) => {
  return <img class={`w-full border border-solid border-gray-300 dark:border-darkish-pink object-cover ${props.class ?? ''}`} src={props.image.fullsize} alt={props.image.alt} />
}


const bskyRpc = new XRPC({ handler: simpleFetchHandler({ service: 'https://api.bsky.app'  }) });

const hydrate = async (views: ToHydrateView[]) => {
  const chunkSize = 25;
  for (let startOfChunk = 0, chunk = views.slice(0, chunkSize); chunk.length; startOfChunk += chunkSize, chunk = views.slice(startOfChunk, startOfChunk+chunkSize)) {
    const uris = chunk.map(v => partsToAtUri(v.skeleton.uri));
    const posts = 
      (await bskyRpc
      .get('app.bsky.feed.getPosts', {params: { uris }}))
      .data.posts 
      .map(post => ({
        ...post,
        uri: atUriToParts(post.uri)!,
      }));
    for (const view of chunk) {
      const post = posts.find(p => p.uri.did === view.skeleton.uri.did && p.uri.rkey === view.skeleton.uri.rkey);
      if (!post) {
        view.setRender(() => <NotFound appviewUrl={getAppviewLink(view.skeleton.uri)} />); 
        continue;
      }
      view.setRender(() => <Render post={post}/>);
    }
  }
}

const getAppviewLink = (uri: AtUriParts) => `https://bsky.app/profile/${uri.did}/post/${uri.rkey}`;

export const bskyPostView: RecordView<'app.bsky.feed.post'> = {
  collection: 'app.bsky.feed.post',
  hydrate,
  getAppviewLink,
  info: {
    name: 'Bluesky'
  }
}

export default bskyPostView;