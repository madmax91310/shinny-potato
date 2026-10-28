const key=id=>`epargnantlibre-radar-draft-v1:${id}`
export function storedDraft(id,fallback){try{const raw=localStorage.getItem(key(id));if(raw===null)return fallback;const value=JSON.parse(raw);return value?.version===1&&typeof value.text==='string'?value.text:fallback}catch{return fallback}}
export function storeDraft(id,text){try{const raw=localStorage.getItem(key(id));if(raw!==null){const value=JSON.parse(raw);if(value?.version!==1||typeof value.text!=='string')return false}localStorage.setItem(key(id),JSON.stringify({version:1,text}));return true}catch{return false}}
