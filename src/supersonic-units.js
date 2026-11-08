/** Presentation only; all records and navigation geometry retain real metres. */
export function formatNavigationDistance(metres,supersonic=false,{space=false}={}){
 if(!Number.isFinite(metres))return '—';
 const gap=space?' ':'';
 return supersonic&&Math.abs(metres)>=1000?`${(metres/1000).toFixed(1)}${gap}km`:`${Math.round(metres)}${gap}m`;
}
