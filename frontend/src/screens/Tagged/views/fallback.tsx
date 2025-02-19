import { A } from "@solidjs/router";
import { RecordView, TaggedViewSkeleton, ToHydrateView } from ".";

const Render = (props: { view: TaggedViewSkeleton }) => {
  return (
    <div class="flex flex-col justify-center">
      <A
        class="underline text-blue-500 dark:text-light-pink"
        href={`https://pdsls.dev/${props.view.record}`}
        target="_blank">
        {props.view.record}
      </A>
    </div>
  )
}

const hydrate = async (views: ToHydrateView[]) => {
  for (const view of views) {
    view.setRender(() => <Render view={view.skeleton}/>);
  }
}

export const fallbackView: RecordView<string> = {
  collection: '*',
  hydrate,
}

export default fallbackView;