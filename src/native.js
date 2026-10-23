import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
const native=Capacitor.isNativePlatform(),key='brava-agenda-v1';
window.BravaNative={
 async read(){return native?(await Preferences.get({key})).value:localStorage.getItem(key);},
 async write(value){if(native)await Preferences.set({key,value});else localStorage.setItem(key,value);},
 async exportBackup(text,filename){
  if(native){const file=await Filesystem.writeFile({path:filename,data:text,directory:Directory.Cache,encoding:Encoding.UTF8});await Share.share({title:'Backup da Agenda Brava',url:file.uri,dialogTitle:'Guardar backup da agenda'});return;}
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
};
