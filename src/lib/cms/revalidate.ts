import { revalidatePath, revalidateTag } from "next/cache";

/** Bust the tagged CMS snapshot + main storefront pages after admin edits. */
export function revalidateStorefront(extraPaths: string[] = []) {
  revalidateTag("cms");
  for (const path of [
    "/",
    "/about",
    "/experience",
    "/bespoke",
    "/bridal",
    "/style-brief",
    "/shop",
    "/shipping",
    "/blog",
    "/checkout",
    "/admin/content",
    ...extraPaths,
  ]) {
    revalidatePath(path);
  }
}
