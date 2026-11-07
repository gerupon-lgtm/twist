import { SCC_COMPAT } from '../vendor/scc/core/config.js';
import { SccFast } from '../vendor/scc/core/scc-fast.js';
import { SccExtRegisters } from '../vendor/scc/core/scc-ext-registers.js';
import { PsgStage } from '../vendor/scc/core/psg-stage.js';
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
  }
  writeSfx(registers){for(let i=0;i<registers.length;i++)this.sfxPsg.psg.writeReg(i,registers[i]);}
  writeMusic(addr,value){
    if(addr<DRUM_ADDR)this.regs.write(addr,value);
    else if(addr===DRUM_STOP_ADDR)this.drums.stopAll();
    else if(addr<DRUM_STOP_ADDR)this.drums.trigger(addr-DRUM_ADDR,value);
  }
  setVolume(volume){this.post.setMaster(Math.max(0,Math.min(100,volume))/100);}
  stopSfx(){this.sfxPsg.reset();}
  stopMusic(){this.chip.reset();this.musicPsg.reset();this.drums.reset();}
  stop(){this.stopSfx();this.stopMusic();this.post.clear();}
  render(out){
    // SCC stays silent in v0.1.17, reserved for the later MIDI player.
    if(this.musicGain===0) {
      for(let i=0;i<out.length;i++)out[i]=this.sfxPsg.sample(this.converter.nextL())*this.sfxGain;
    } else {
      for(let i=0;i<out.length;i++){
        const L=this.converter.nextL();
        out[i]=(this.chip.sumTicks(L)/(L*1024)+this.musicPsg.sample(L))*this.musicGain+this.sfxPsg.sample(L)*this.sfxGain;
      }
    }
    this.drums.tick(out.length/this.rate);
    this.post.process(out);
  }
}
