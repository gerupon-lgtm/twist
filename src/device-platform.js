/** UA is used only for device-specific instructions, never for game controls. */
export function isIPhone(userAgent = '') {
  return typeof userAgent === 'string' && /\biPhone\b/i.test(userAgent);
}

export function iPhoneOrientationNotice({ userAgent = '', landscape = false } = {}) {
  if (!isIPhone(userAgent)) return null;
  return landscape
    ? { title: 'iPhoneの画面の向き', text: '「画面縦向きのロック」は縦向き用です。横向きで遊ぶときは、開始した向きを保ってください。' }
    : { title: 'iPhoneは縦向きロックがおすすめ', text: 'コントロールセンターで「画面縦向きのロック」をオンにすると、画面の自動回転を防げます。' };
}
