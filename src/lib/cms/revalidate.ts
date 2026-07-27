import { revalidatePath, revalidateTag } from "next/cache";

/** Bust the tagged CMS snapshot + main storefront pages after admin edits. */
export function revalidateStorefront(extraPaths: string[] = []) {
  revalidateTag("cms");
  for (const path of ["/", "/about", "/experience", "/style-brief", "/shop", "/blog", "/admin/content", ...extraPaths]) {
    revalidatePath(path);
  }
}
