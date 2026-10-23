const fs=require('node:fs');
const path=require('node:path');
async function build(){await require('esbuild').build({entryPoints:['src/native.js'],outfile:'public/native.js',bundle:true,format:'iife',target:['chrome89'],minify:true});fs.mkdirSync('dist',{recursive:true});for(const name of ['index.html','style.css','model.js','native.js','app.js'])fs.copyFileSync(path.join('public',name),path.join('dist',name));}
build().catch(e=>{console.error(e);process.exit(1);});
