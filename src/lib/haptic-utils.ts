import { triggerHaptic } from "tactus";

/**
 * Haptic feedback utility for SynthOS
 * Provides different haptic patterns for various user interactions
 */
export const hapticFeedback = {
  // Quick tap for buttons/selections (50ms)
  light: () => triggerHaptic(50),

  // Standard feedback for actions (100ms - default)
  medium: () => triggerHaptic(),

  // Success/completion feedback (150ms)
  success: () => triggerHaptic(150),

  // Critical action confirmation (200ms)
  heavy: () => triggerHaptic(200),

  // Error feedback (double pulse pattern)
  error: () => {
    triggerHaptic(80);
    setTimeout(() => triggerHaptic(80), 100);
  },

  // Copy action feedback (quick double tap)
  copy: () => {
    triggerHaptic(60);
    setTimeout(() => triggerHaptic(40), 80);
  },
};

/**
 * Safe haptic trigger with error handling
 * Use this wrapper for production to prevent crashes on unsupported devices
 */
export const safeHaptic = (type: keyof typeof hapticFeedback) => {
  try {
    hapticFeedback[type]();
  } catch (error) {
    // Silently fail on unsupported devices
    console.debug("Haptic feedback not supported:", error);
  }
};

// Individual exported functions for easier importing
export const lightHaptic = () => safeHaptic("light");
export const mediumHaptic = () => safeHaptic("medium");
export const successHaptic = () => safeHaptic("success");
export const heavyHaptic = () => safeHaptic("heavy");
export const errorHaptic = () => safeHaptic("error");
export const copyHaptic = () => safeHaptic("copy");
