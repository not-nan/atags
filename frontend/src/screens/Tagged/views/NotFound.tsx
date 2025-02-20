import { A } from "@solidjs/router"

export const NotFound = (props: { appviewUrl: string }) => {
  return (
    <>
      <A class="text-blue-500 underline" href={props.appviewUrl} target="_blank">{ props.appviewUrl }</A>
      <p>Record not found</p>
    </>
  );
}

export default NotFound;