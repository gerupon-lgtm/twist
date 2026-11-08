export const RADAR_UPGRADE_KEY='twist.radar-upgrade.v1';
/** Ask once for the known former 60m default; leave every saved value intact. */
export function radarUpgradeOffer(settingsStorage,noticeStorage=settingsStorage){
  let value,seen=false;try{value=JSON.parse(settingsStorage?.getItem('twist.flight-settings.v1'));seen=noticeStorage?.getItem(RADAR_UPGRADE_KEY)==='shown';}catch{}
  if(seen||value?.radarRange!==60)return null;
  let marked=false;
  return {
    current:60,next:180,
    shown(){if(marked)return;marked=true;try{noticeStorage?.setItem(RADAR_UPGRADE_KEY,'shown');}catch{}},
  };
}
