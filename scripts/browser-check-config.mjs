// Measured costs schedule work; they must never silently change timeout policy.
export const schedulingDurations = config => config.schedulingSeconds ?? config.seconds
export const browserCheckTimeoutMs = (command, limits) => Math.max(300, Math.min(1800, (limits[command] || 60) * 3)) * 1000
