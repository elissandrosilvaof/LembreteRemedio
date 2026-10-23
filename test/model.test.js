const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../public/model');
const base={id:'1',name:'Cliente',phone:'11999999999',service:'combo',date:'2030-01-07',time:'10:00',status:'confirmed'};
test('bloqueia sobreposição pela duração e libera após cancelamento',()=>{assert.throws(()=>M.saveBooking([base],{...base,id:'2',time:'10:30'}),/sobrepostos/);assert.equal(M.saveBooking([{...base,status:'cancelled'}],{...base,id:'2',time:'10:30'}).length,2);assert.equal(M.saveBooking([base],{...base,id:'2',time:'11:00'}).length,2);});
test('edição não conflita consigo mesma',()=>{const list=M.saveBooking([base],{...base,name:'Novo nome',time:'10:30'});assert.equal(list.length,1);assert.equal(list[0].time,'10:30');});
test('rejeita datas, telefone, domingo e serviço que ultrapassa fechamento',()=>{for(const patch of [{date:'2030-02-30'},{date:'2030-01-06'},{phone:'123'},{time:'18:30'},{time:'08:30'},{time:'10:15'}])assert.throws(()=>M.validateBooking({...base,...patch}));});
test('restaura backup completo sem aceitar duplicatas ou conflitos',()=>{const backup={app:'brava-agenda',version:1,bookings:[base]};assert.deepEqual(M.parseBackup(JSON.stringify(backup)),[base]);assert.throws(()=>M.parseBackup(JSON.stringify({...backup,version:2})));assert.throws(()=>M.validateAll([base,base]),/repetidos/);assert.throws(()=>M.validateAll([base,{...base,id:'2'}]),/sobrepostos/);});
test('horário passado não pode ser salvo como agendado',()=>{assert.throws(()=>M.saveBooking([],base,new Date('2030-01-08T10:00:00')),/futuro/);});
