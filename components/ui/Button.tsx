import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const sizes: Record<Size, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-7 py-3.5 text-[0.95rem]",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-hunter)] font-semibold text-[var(--color-ivory)] shadow-[0_10px_24px_-14px_rgba(31,58,46,0.75)] hover:bg-[var(--color-evergreen)] hover:-translate-y-px hover:shadow-[0_16px_30px_-16px_rgba(31,58,46,0.7)]",
  secondary:
    "text-[var(--color-ink)]/70 hover:text-[var(--color-hunter)] hover:underline underline-offset-4 decoration-[1.5px] decoration-[color-mix(in_srgb,var(--color-hunter)_45%,transparent)]",
  ghost: "text-[var(--color-ink)] hover:text-[var(--color-hunter)]",
};

type AnchorProps = ComponentPropsWithoutRef<"a"> & {
  as?: "a";
  variant?: Variant;
  size?: Size;
};
type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  as: "button";
  variant?: Variant;
  size?: Size;
};

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Button(props: AnchorProps | ButtonProps) {
  const { variant = "primary", size = "md", className = "", children, ...rest } =
    props;
  const classes = `group/btn ${base} ${sizes[size]} ${variants[variant]} ${className}`;
  const content = (
    <>
      {children}
      {variant === "secondary" && <Chevron />}
    </>
  );

  if (rest.as === "button") {
    const { as: _as, ...buttonRest } = rest as Omit<ButtonProps, "variant" | "size">;
    return (
      <button className={classes} {...buttonRest}>
        {content}
      </button>
    );
  }
  const { as: _as, ...anchorRest } = rest as Omit<AnchorProps, "variant" | "size">;
  return (
    <a className={classes} {...anchorRest}>
      {content}
    </a>
  );
}
