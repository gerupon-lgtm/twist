/** BGM alone follows the audible GO tail; flight never awaits this gate. */
export function createLaunchMusicGate({play,stop,isAllowed=()=>true}){
  let active=false,session=null,cueSession=null,barrier=null,generation=0,phase='idle';
  function request(){
    const token=++generation;
    if(!active||!isAllowed()){phase='blocked';return;}
    if(session!==null){phase='await-go';return;}
    const release=()=>{
      if(token!==generation||!active||!isAllowed())return;
      barrier=null;cueSession=null;phase='released';void play();
    };
    if(barrier){phase='cue';void barrier.then(release,release);}else release();
  }
  function cancel(){active=false;session=null;cueSession=null;barrier=null;generation++;phase='idle';stop();}
  return {
    prepare(value){cancel();session=value;phase='prepared';},
    start(){active=true;request();},
    go(value,{played=false,completion=null}={}){
      if(!active||session!==value)return;
      session=null;cueSession=value;barrier=played?Promise.resolve(completion):null;request();
    },
    request,
    cancelSession(value){if(session===value||cueSession===value)cancel();},
    stop:cancel,
    snapshot:()=>({phase,session:session??cueSession,pending:session!==null||barrier!==null}),
  };
}
