import {expect} from '@playwright/test';
import {waitForCountdownThree} from './countdown.js';
/** Outside view is a fresh course-entry choice; rear/cockpit switch in flight. */
export async function chooseFlightCamera(page,camera){
 const current=await page.locator('#app').getAttribute('data-camera');if(current===camera)return;
 if(current!=='overlay'&&camera!=='overlay'){await page.locator('#start-flow-view-button').click();await page.clock.runFor(180);}
 else{
  await page.locator('#pause-button').click();await page.locator('#start-flow-course-exit').click();await page.locator('#start-flow-confirm-exit').click();
  await page.locator(`#start-flow-course-camera [data-flow-value=${camera}]`).click();await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();await page.clock.runFor(120);await waitForCountdownThree(page);await page.clock.runFor(3500);
 }
 await expect(page.locator('#app')).toHaveAttribute('data-camera',camera);
}
