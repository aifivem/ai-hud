import type { ReactNode } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"

/** White text over the game without a pill (lumihud `--textShadow`). */
export const TEXT_SHADOW = "[text-shadow:0.15vh_0.1vh_0_#252525]"
/** The danger token for SVG and inline styles (Tailwind emits a theme var that a source file references). */
export const DANGER = "var(--color-danger-solid)"
export const clamp = (v: number) => Math.min(100, Math.max(0, v))

/** Round dark icon circle (lumihud `indicator_left`). */
export function IconCircle({
  icon,
  color,
  className = "bg-tgi-dark",
}: {
  icon: IconDefinition
  color?: string
  className?: string
}) {
  return (
    <span
      className={`flex size-[2.6vh] shrink-0 items-center justify-center rounded-full ${className}`}
      style={color ? { color } : undefined}
    >
      <FontAwesomeIcon icon={icon} className="text-[1.3vh]" />
    </span>
  )
}

/** Dark pill next to an icon circle (lumihud `indicator_big` / `location_right`). */
export function Pill({
  children,
  className = "gap-[1vh]",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`flex h-[2.6vh] items-center rounded-full bg-tgi-dark px-[1vh] ${className}`}
    >
      {children}
    </span>
  )
}

export const Value = ({ value }: { value: number }) => (
  <span className="flex min-w-[2.5vh] justify-center text-[1.2vh] text-white/70 tabular-nums">
    {Math.floor(value)}
  </span>
)
