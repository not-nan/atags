import { A } from "@solidjs/router"

export const NotFound = (props: { appviewUrl: string }) => {
  return (
    <>
      <A class="text-blue-500 dark:text-light-pink underline" href={props.appviewUrl} target="_blank">{ props.appviewUrl }</A>
      <p>Record not found</p>
    </>
  );
}

export default NotFound;