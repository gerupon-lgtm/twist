import { iPhoneOrientationNotice } from './device-platform.js';

/** In the opening card, this temporary notice replaces the heading without covering controls. */
export function createOrientationToast({ root, userAgent, duration = 10000 }) {
  let timer;
  function hide() { clearTimeout(timer); root.hidden = true; }
  function show() {
    const notice = iPhoneOrientationNotice({ userAgent, landscape: innerWidth > innerHeight });
    if (!notice) { hide(); return; }
    root.querySelector('[data-notice-title]').textContent = notice.title;
    root.querySelector('[data-notice-copy]').textContent = notice.text;
    root.hidden = false;
    clearTimeout(timer); timer = setTimeout(hide,duration);
  }
  root.querySelector('button').addEventListener('click',hide);
  return { show, hide, refresh() { if (!root.hidden) show(); } };
}
