import {expect} from '@playwright/test';

/** Advance paused time through preparation only; the caller still tests all3 countdown seconds. */
export async function waitForCountdownThree(page,{maxPrepareMilliseconds=2000}={}){
  let preparationMilliseconds=0;
  const counter=page.locator('#start-flow-countdown');
  while(true){
    const state=await page.locator('#start-flow-panel').evaluate(panel=>{
      const output=document.getElementById('start-flow-countdown');
      return {step:panel.dataset.step,number:output?.textContent?.trim(),visible:Boolean(output?.getClientRects().length)};
    });
    expect(state.step,'preparation must remain in countdown, without skipping straight to flight').toBe('countdown');
    if(state.visible&&state.number==='3')break;
    if(preparationMilliseconds>=maxPrepareMilliseconds)throw new Error(`Countdown preparation did not display3 within${maxPrepareMilliseconds}ms: ${JSON.stringify(state)}`);
    await page.clock.runFor(50);preparationMilliseconds+=50;
  }
  await expect(counter).toBeVisible();await expect(counter).toHaveText('3');
  return preparationMilliseconds;
}
