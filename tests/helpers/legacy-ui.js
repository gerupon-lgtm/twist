import {test as base,expect} from '@playwright/test';

/** Prior-feature regressions retain the released UI; default start-flow tests import Playwright directly. */
export const test=base.extend({
  page:async({page},use)=>{
    await page.addInitScript(()=>{
      if(!/^https?:$/.test(location.protocol))return;
      const url=new URL(location.href);
      url.searchParams.set('dev','1');
      url.searchParams.set('flow','legacy');
      history.replaceState(null,'',url);
    });
    await use(page);
  },
});
export {expect};
