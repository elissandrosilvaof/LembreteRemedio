const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = {'/':'index.html','/app.js':'app.js','/model.js':'model.js','/native.js':'native.js','/style.css':'style.css'};
http.createServer((req,res)=>{
 const file = files[new URL(req.url,'http://localhost').pathname];
 if(!file){res.writeHead(404);return res.end('Não encontrado');}
 fs.readFile(path.join(__dirname,'public',file),(err,data)=>{
  if(err){res.writeHead(500);return res.end('Erro ao carregar página');}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(data);
 });
}).listen(process.env.PORT || 3000,'0.0.0.0',()=>console.log('Barbearia iniciada na porta '+(process.env.PORT || 3000)));
