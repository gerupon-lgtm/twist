import { SCC_COMPAT } from '../vendor/scc/core/config.js';
import { SccFast } from '../vendor/scc/core/scc-fast.js';
import { SccExtRegisters } from '../vendor/scc/core/scc-ext-registers.js';
import { PsgStage,PSG_GAIN } from '../vendor/scc/core/psg-stage.js';
import { PSG_TABLE,SCC_CLOCKS_PER_PSG_TICK } from '../vendor/scc/core/psg-ref.js';
import { WindowConverter } from '../vendor/scc/core/window-converter.js';
import { PostStage } from '../vendor/scc/core/post-stage.js';
import { PsgDrums,DRUM_ADDR,DRUM_STOP_ADDR } from '../vendor/scc/engine/psg-drums.js';

/** Separate PSG chips share a sample clock, not registers, drums or noise. */
export class ChipMixer {
  constructor(rate=48000) {
    this.chip=new SccFast(SCC_COMPAT);this.regs=new SccExtRegisters(this.chip);
    this.musicPsg=new PsgStage();this.sfxPsg=new PsgStage();
    this.drums=new PsgDrums(this.musicPsg.psg);this.rate=rate;
    this.converter=new WindowConverter(SCC_COMPAT.clock,rate);this.post=new PostStage(rate,5);
    this.musicGain=0;this.sfxGain=1;this.post.setMaster(.25);this.post.clear();
    this.navigationPost=new PostStage(rate,5);this.navigationPost.setMaster(.25);this.navigationPost.clear();
    this.navigationBuffer=new Float32Array(0);this.navigationSplit=false;this.navigationSample=0;this.backgroundSample=0;this.stereoPeak=0;
    this.fmPrePostPeak=0;
  }
  writeSfx(registers){for(let i=0;i<registers.length;i++)this.sfxPsg.psg.writeReg(i,registers[i]);}
  writeMusic(addr,value){
    if(addr<DRUM_ADDR)this.regs.write(addr,value);
    else if(addr===DRUM_STOP_ADDR)this.drums.stopAll();
    else if(addr<DRUM_STOP_ADDR)this.drums.trigger(addr-DRUM_ADDR,value);
  }
  setVolume(volume){const gain=Math.max(0,Math.min(100,volume))/100;this.post.setMaster(gain);this.navigationPost.setMaster(gain);}
  cancelNavigation(){this.navigationPost.clear();this.navigationSplit=false;this.navigationSample=0;}
  stopSfx(){this.sfxPsg.reset();this.cancelNavigation();}
  stopMusic(){this.chip.reset();this.musicPsg.reset();this.drums.reset();}
  stop(){this.stopSfx();this.stopMusic();this.post.clear();this.stereoPeak=0;}
  takePeak(){const peak=Math.max(this.post.takePeak(),this.stereoPeak);this.stereoPeak=0;this.navigationPost.takePeak();return peak;}
  /** Split only navigation's channel C; engine/wind A stays in the common output.
   * The resistor table is nonlinear, so C's contribution is mixed minus background.
   * This advances the existing PSG once; no chip, register or clock is duplicated. */
  sampleNavigation(L){
    const stage=this.sfxPsg;
    if(!this.navigationSplit){this.backgroundSample=stage.last;this.navigationSample=0;this.navigationSplit=true;}
    stage.phase+=L;
    const n=Math.floor(stage.phase/SCC_CLOCKS_PER_PSG_TICK);stage.phase-=n*SCC_CLOCKS_PER_PSG_TICK;
    if(n>0){
      let mixed=0,background=0;
      for(let i=0;i<n;i++){const index=stage.psg.tick();mixed+=PSG_TABLE[index];background+=PSG_TABLE[index&0x30ff];}
      stage.last=(mixed/n-PSG_TABLE[0])*PSG_GAIN;
      this.backgroundSample=(background/n-PSG_TABLE[0])*PSG_GAIN;
      this.navigationSample=stage.last-this.backgroundSample;
    }
    return this.backgroundSample;
  }
  renderNavigation(out,right,pan,fm=null,impact=null){
    if(this.navigationBuffer.length!==out.length)this.navigationBuffer=new Float32Array(out.length);
    const navigation=this.navigationBuffer;
    for(let i=0;i<out.length;i++){
      const L=this.converter.nextL();
      const background=this.sampleNavigation(L)*this.sfxGain;
      navigation[i]=this.navigationSample*this.sfxGain;
      if(fm)out[i]=this.musicGain===0?background:(this.chip.sumTicks(L)/(L*1024)+this.musicPsg.sample(L)+fm[i])*this.musicGain+background;
      else out[i]=this.musicGain===0?background:(this.chip.sumTicks(L)/(L*1024)+this.musicPsg.sample(L))*this.musicGain+background;
      if(fm)this.fmPrePostPeak=Math.max(this.fmPrePostPeak,Math.abs(out[i]));
    }
    if(impact)for(let i=0;i<out.length;i++)out[i]+=impact[i]*this.sfxGain;
    this.drums.tick(out.length/this.rate);this.post.process(out);this.navigationPost.process(navigation);
    const p=Math.max(-1,Math.min(1,pan)),gainLeft=(1-p)/2,gainRight=(1+p)/2;
    for(let i=0;i<out.length;i++){
      // Limit the added cue uniformly for every pan; the existing common signal
      // stays untouched and the left+right cue sum remains constant at high levels.
      const common=out[i],cue=Math.max(-1-common,Math.min(1-common,navigation[i]));
      if(right){
        out[i]=common+cue*gainLeft;
        right[i]=common+cue*gainRight;
        this.stereoPeak=Math.max(this.stereoPeak,Math.abs(out[i]),Math.abs(right[i]));
      }else{
        out[i]=common+cue*.5;this.stereoPeak=Math.max(this.stereoPeak,Math.abs(out[i]));
      }
    }
  }
  render(out,right=null,navigationPan=null,fm=null,impact=null){
    if(Number.isFinite(navigationPan)){this.renderNavigation(out,right,navigationPan,fm,impact);return;}
    this.cancelNavigation();
    // SCC stays silent in v0.1.17, reserved for the later MIDI player.
    if(this.musicGain===0) {
      for(let i=0;i<out.length;i++)out[i]=this.sfxPsg.sample(this.converter.nextL())*this.sfxGain;
    } else if(fm){
      for(let i=0;i<out.length;i++){
        const L=this.converter.nextL();
        out[i]=(this.chip.sumTicks(L)/(L*1024)+this.musicPsg.sample(L)+fm[i])*this.musicGain+this.sfxPsg.sample(L)*this.sfxGain;
        this.fmPrePostPeak=Math.max(this.fmPrePostPeak,Math.abs(out[i]));
      }
    } else {
      for(let i=0;i<out.length;i++){
        const L=this.converter.nextL();
        out[i]=(this.chip.sumTicks(L)/(L*1024)+this.musicPsg.sample(L))*this.musicGain+this.sfxPsg.sample(L)*this.sfxGain;
      }
    }
    if(impact)for(let i=0;i<out.length;i++)out[i]+=impact[i]*this.sfxGain;
    this.drums.tick(out.length/this.rate);
    this.post.process(out);
    if(right)right.set(out);
  }
}
