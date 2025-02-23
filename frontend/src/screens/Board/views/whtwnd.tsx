import { A } from "@solidjs/router";
import { RecordView, TaggedViewSkeleton, ToHydrateView } from ".";
import { AtUriParts, partsToAtUri } from "../../../lib/util";

const Render = (props: { view: TaggedViewSkeleton }) => {
  const aturi = partsToAtUri(props.view.uri);
  return (
    <div class="flex flex-col justify-center">
      <A
        class="underline text-blue-500 dark:text-light-pink"
        href={`https://pdsls.dev/${aturi}`}
        target="_blank">
        {aturi}
      </A>
    </div>
  )
}

const hydrate = async (views: ToHydrateView[]) => {
  for (const view of views) {
    view.setRender(() => <Render view={view.skeleton}/>);
  }
}

const getAppviewLink = (uri: AtUriParts) => `https://pdsls.dev/${partsToAtUri(uri)}`;

export const whtwndView: RecordView<'com.whtwnd.blog.entry'> = {
  collection: 'com.whtwnd.blog.entry',
  hydrate,
  getAppviewLink,
  info: {
    name: 'Whtwnd'
  }
}

export default whtwndView;