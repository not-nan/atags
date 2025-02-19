import { A } from "@solidjs/router";
import { RecordView, TaggedViewSkeleton, ToHydrateView } from ".";
import { wait } from "../../../lib/util";

const Render = (props: { view: TaggedViewSkeleton }) => {
  return (
    <div class="flex flex-col justify-center">
      <A
        class="underline text-blue-500 dark:text-light-pink"
        href={`https://bsky.app/profile/${props.view.uri.did}/post/${props.view.uri.rkey}`}
        target="_blank">
        {props.view.record}
      </A>
    </div>
  )
}

const hydrate = async (views: ToHydrateView[]) => {
  await Promise.all(views.map(async view => {
    await wait(Math.random() * 5000);
    view.setRender(() => <Render view={view.skeleton}/>);
  }));
}

export const bskyPostView: RecordView<'app.bsky.feed.post'> = {
  collection: 'app.bsky.feed.post',
  hydrate,
}

export default bskyPostView;