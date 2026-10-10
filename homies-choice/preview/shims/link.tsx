import { forwardRef, type AnchorHTMLAttributes } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; scroll?: boolean; replace?: boolean };

// Plain anchor: internal clicks are intercepted globally by the preview app.
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ prefetch, scroll, replace, ...rest }, ref) {
  return <a ref={ref} {...rest} />;
});
export default Link;
