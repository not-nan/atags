import { A } from "@solidjs/router"

export const NotFound = (props: { appviewUrl: string }) => {
  return (
    <div>
      <A class="text-blue-500 dark:text-light-pink underline" href={props.appviewUrl} target="_blank">{ props.appviewUrl }</A>
      <p>Record not found</p>
    </div>
  );
}

export default NotFound;