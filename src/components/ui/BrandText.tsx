import { Fragment } from "react";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Renders copy so `MKoS` keeps its lowercase o inside CSS `uppercase` parents.
 * Wrap the brand token in `normal-case`; leave the rest to the parent's transform.
 */
export function BrandText({
  children,
  as: Tag = "span",
  className,
}: {
  children: string;
  as?: "span" | "p" | "div";
  className?: string;
}) {
  const parts = children.split(/(\bmkos\b)/gi);
  return (
    <Tag className={className}>
      {parts.map((part, i) =>
        /^mkos$/i.test(part) ? (
          <span key={i} className="normal-case">
            {BRAND_NAME}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </Tag>
  );
}
