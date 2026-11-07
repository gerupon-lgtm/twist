export function changedSettings(fields,values) {
  return Object.keys(fields).filter(key=>values[key]!==fields[key].initial);
}
export function initialSettingText(field) {
  if(field.auto&&field.initial===0)return '自動';
  if(field.options)return field.options[field.initial];
  if(typeof field.initial==='boolean')return field.initial?'オン':'オフ';
  return `${field.initial}${field.unit??''}`;
}
