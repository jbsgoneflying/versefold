import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const sizes = "px-6 py-3";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-hunter)] text-[var(--color-ivory)] hover:bg-[var(--color-evergreen)] shadow-[0_10px_24px_-12px_rgba(31,58,46,0.7)]",
  secondary:
    "bg-transparent text-[var(--color-ink)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-stone)_45%,transparent)] hover:ring-[var(--color-hunter)] hover:text-[var(--color-hunter)]",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:text-[var(--color-hunter)]",
};

type AnchorProps = ComponentPropsWithoutRef<"a"> & {
  as?: "a";
  variant?: Variant;
};
type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  as: "button";
  variant?: Variant;
};

export function Button(props: AnchorProps | ButtonProps) {
  const { variant = "primary", className = "", ...rest } = props;
  const classes = `${base} ${sizes} ${variants[variant]} ${className}`;

  if (rest.as === "button") {
    const { as: _as, ...buttonRest } = rest as ButtonProps;
    return <button className={classes} {...buttonRest} />;
  }
  const { as: _as, ...anchorRest } = rest as AnchorProps;
  return <a className={classes} {...anchorRest} />;
}
