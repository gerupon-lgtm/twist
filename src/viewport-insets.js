/** Respect the same physical notch/safe-area margins as the original top bar. */
export function viewportInsets() {
  const style=getComputedStyle(document.documentElement);
  return {left:Math.max(0,parseFloat(style.getPropertyValue('--screen-safe-left'))||0),
    right:Math.max(0,parseFloat(style.getPropertyValue('--screen-safe-right'))||0)};
}
