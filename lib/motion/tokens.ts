
export const durations = {
  micro: 0.12, // 120ms - fast micro-interactions
  small: 0.2,  // 200ms - standard hover/active
  medium: 0.3, // 300ms - layout shifts, panels
  large: 0.45, // 450ms - full screen transitions
} as const;

export const easings = {
  standard: [0.2, 0, 0, 1], // ease-out-cubic equivalent
  inOut: [0.4, 0, 0.2, 1], // material standard
  out: [0, 0, 0.2, 1], // sudden enter
} as const;

export const spring = {
  stiffness: 300,
  damping: 30,
  mass: 1,
} as const;

export const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.small, ease: easings.standard }
  },
  scaleTap: {
    scale: 0.98,
    transition: { duration: durations.micro, ease: easings.standard }
  },
  hover: {
    scale: 1.01,
    transition: { duration: durations.micro, ease: easings.standard }
  },
};
