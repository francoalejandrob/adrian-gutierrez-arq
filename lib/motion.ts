export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

export const REVEAL_TRANSITION = {
  duration: 0.7,
  ease: EASE_OUT,
} as const;

export function revealUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-12% 0px" },
    transition: { ...REVEAL_TRANSITION, delay },
  } as const;
}
