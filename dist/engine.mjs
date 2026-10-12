export const CHAPTERS = [
  {title:'Neighborhood watch.',short:'Neighborhood watch',district:'QUEENS',time:'GOLDEN HOUR · 6:42 PM',type:'tokens',target:8,length:3700,theme:'sunset',description:'A quiet evening. A familiar skyline. And a suspicious trail of stolen tech across the rooftops. Time for a little neighborhood patrol.',objective:'Collect 8 web tokens, then reach the rooftop beacon.',hint:'Hold X or SWING to attach a web. Release to fly.',art:'sunset',caption:'JUST ANOTHER EVENING IN QUEENS…'},
  {title:'A helping hand.',short:'A helping hand',district:'LOWER EAST SIDE',time:'DUSK · 7:18 PM',type:'rescue',target:3,length:3900,theme:'dusk',description:'The Goblin’s drones have left three neighbors stranded high above the streets. Get them somewhere safe. That’s what neighbors do.',objective:'Rescue 3 citizens, then follow the rooftop beacon.',hint:'Get close to the waving neighbors to bring them to safety.',art:'friendly',caption:'ACROSS TOWN, SOMEONE NEEDS A HAND…'},
  {title:'Unfriendly skies.',short:'Unfriendly skies',district:'MIDTOWN',time:'BLUE HOUR · 8:06 PM',type:'drones',target:6,length:4000,theme:'blue',description:'So much for a night off. A swarm of drones is taking over Midtown. A few well-placed webs should clear the air.',objective:'Web 6 drones and reach the end of the district.',hint:'Press C or WEB to shoot. Nearby targets are aimed at automatically.',art:'action',caption:'THERE GOES THE QUIET NIGHT.'},
  {title:'Lights out.',short:'Lights out',district:'HELL’S KITCHEN',time:'AFTER DARK · 9:24 PM',type:'cells',target:5,length:4200,theme:'night',limit:180,description:'New York has gone dark. The power cells are scattered, the drones are circling, and the grid needs a hero. Bring the lights back before time runs out.',objective:'Recover 5 power cells in 3 minutes, then reach the beacon.',hint:'The glowing blue cells are on the rooftops. Keep moving!',art:'sunset',caption:'A CITY THAT NEVER SLEEPS. UNTIL NOW.'},
  {title:'One last swing.',short:'One last swing',district:'FINANCIAL DISTRICT',time:'THE FINAL SHOWDOWN · 10:02 PM',type:'boss',target:16,length:3500,theme:'night',description:'The Green Goblin is waiting above the city. Dodge his pumpkin bombs, swing into position, and show him whose neighborhood this is.',objective:'Defeat the Green Goblin. Keep your distance and keep firing.',hint:'Web the Goblin when he is in range. Swing to dodge his bombs.',art:'action',caption:'THE NEIGHBORHOOD HAS ONE MORE VISITOR.'}
];

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rng(seed){let s=seed|0;return()=>{s=(Math.imul(s,1664525)+1013904223)|0;return(s>>>0)/4294967296;};}

export class Game {
  constructor(onEvent=()=>{}){this.onEvent=onEvent;this.mode='menu';this.chapter=0;this.time=0;this.totalScore=0;this.viewW=960;this.viewH=540;this.inputs={left:false,right:false,jump:false,swing:false,shoot:false};this.previous={...this.inputs};this.setup(0);this.mode='menu';}
  setup(index){
    this.chapter=index;this.config=CHAPTERS[index];this.time=0;this.elapsed=0;this.collected=0;this.score=0;this.kills=0;this.combo=0;this.shake=0;this.winDelay=0;this.stateVersion=0;this.shots=[];this.bombs=[];this.particles=[];this.labels=[];this.rope=null;this.checkpoint=0;this.camX=0;this.camY=0;this.fireCooldown=0;this.jumpBuffer=0;this.coyote=0;this.wasSwing=false;this.exitAnnounced=false;this.previous={...this.inputs};
    const random=rng(120+index*57);this.platforms=[];let x=0;let i=0;
    while(x<this.config.length+400){const w=i===0?300:210+Math.floor(random()*90);const y=i===0?415:340+Math.floor(random()*95);this.platforms.push({x,y,w,h:600-y,style:Math.floor(random()*5),seed:Math.floor(random()*10000),checkpoint:false});x+=w+50+Math.floor(random()*45);i++;}
    this.anchors=this.platforms.map(p=>({x:p.x+p.w*.7,y:p.y-160}));
    this.player={x:100,y:395,vx:0,vy:0,w:22,h:38,hp:5,face:1,ground:true,jumps:0,invincible:0,anim:0};
    this.pickups=[];this.citizens=[];this.enemies=[];
    this.platforms.forEach((p,j)=>{if(j>0&&p.x<this.config.length-250){if(this.config.type==='tokens'){for(let k=0;k<2;k++)this.pickups.push({x:p.x+60+k*75,y:p.y-35-(k%2)*45,kind:'token',taken:false});}if(this.config.type==='cells'&&j<=7)this.pickups.push({x:p.x+p.w*.5,y:p.y-32,kind:'cell',taken:false});if(this.config.type==='rescue'&&[2,5,8].includes(j))this.citizens.push({x:p.x+p.w*.5,y:p.y,rescued:false});if(j%2===1||this.config.type==='drones')this.enemies.push({x:p.x+p.w*.55,y:p.y-70,baseY:p.y-70,homeX:p.x+p.w*.55,phase:random()*6.28,hp:index>=3?2:1,dead:false,timer:2+random()*2});}});
    const finalPlatform=this.platforms.find(p=>p.x>this.config.length-500)||this.platforms.at(-2);this.exit={x:finalPlatform.x+finalPlatform.w*.7,y:finalPlatform.y};
    this.boss=this.config.type==='boss'?{x:this.exit.x-180,y:220,homeX:this.exit.x-160,hp:16,phase:0,timer:1.5,active:false}:null;
    this.onEvent({type:'hud'});
  }
  start(index=this.chapter){this.setup(index);this.mode='playing';this.onEvent({type:'start'});}
  notify(message){this.onEvent({type:'toast',message});}
  progress(){return this.config.type==='drones'?this.kills:this.config.type==='boss'?16-(this.boss?.hp||0):this.collected;}
  ready(){return this.progress()>=this.config.target;}
  burst(x,y,color,count=12){const random=rng(Math.floor(this.time*300)+Math.floor(x));for(let i=0;i<count;i++)this.particles.push({x,y,vx:(random()-.5)*190,vy:(random()-.7)*190,life:.3+random()*.5,maxLife:.8,color,size:2+random()*3});}
  label(x,y,text,color='#ffecb4'){this.labels.push({x,y,text,color,life:1.2});}
  hit(amount=1){const p=this.player;if(p.invincible>0||this.mode!=='playing')return;p.hp-=amount;p.invincible=1.6;p.vy=-190;this.shake=7;this.combo=0;this.burst(p.x,p.y,'#d64738',14);this.onEvent({type:'sound',sound:'hit'});this.onEvent({type:'hud'});if(p.hp<=0){this.mode='gameover';this.onEvent({type:'gameover',reason:'health'});}}
  attach(){const p=this.player;let anchor=this.anchors.filter(a=>a.x>p.x+35&&a.x<p.x+420&&a.y<p.y-45).sort((a,b)=>a.x-b.x)[0];if(!anchor)anchor=this.anchors.filter(a=>Math.abs(a.x-p.x)<400&&a.y<p.y-35).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];if(anchor){const dx=p.x-anchor.x,dy=p.y-anchor.y;this.rope={...anchor,length:clamp(Math.hypot(dx,dy),100,230)};p.ground=false;p.jumps=1;if(Math.abs(p.vx)<150)p.vx=180*p.face;p.vy=Math.min(p.vy,-160);this.onEvent({type:'sound',sound:'swing'});}}
  shoot(){
    if(this.fireCooldown>0)return;const p=this.player;this.fireCooldown=.26;
    const targets=this.enemies.filter(e=>!e.dead&&Math.abs(e.x-p.x)<390&&Math.abs(e.y-p.y)<200);if(this.boss?.active&&this.boss.hp>0&&Math.abs(this.boss.x-p.x)<430)targets.push(this.boss);
    let target=targets.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];let dx=target?target.x-p.x:p.face*100,dy=target?target.y-p.y+8:0;const d=Math.hypot(dx,dy)||1;this.shots.push({x:p.x+p.face*12,y:p.y-8,vx:dx/d*650,vy:dy/d*650,life:.85,trail:[]});this.onEvent({type:'sound',sound:'web'});
  }
  update(dt){
    dt=Math.min(dt,.033);this.time+=dt;
    if(this.mode!=='playing'){this.animateParticles(dt);return;}
    this.elapsed+=dt;const p=this.player,inp=this.inputs;p.anim+=dt;p.invincible=Math.max(0,p.invincible-dt);this.fireCooldown=Math.max(0,this.fireCooldown-dt);this.shake=Math.max(0,this.shake-dt*25);this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    if(inp.jump&&!this.previous.jump)this.jumpBuffer=.15;if(p.ground)this.coyote=.12;else this.coyote=Math.max(0,this.coyote-dt);
    const dir=(inp.right?1:0)-(inp.left?1:0);if(dir)p.face=dir;
    p.vx+=dir*(this.rope?700:1050)*dt;p.vx*=Math.pow(p.ground&&!dir?.00015:(!dir&&!this.rope?.45:.85),dt);p.vx=clamp(p.vx,-430,430);
    if(this.jumpBuffer>0&&(this.coyote>0||p.jumps<2)){p.vy=-430;p.jumps++;p.ground=false;this.coyote=0;this.jumpBuffer=0;this.rope=null;this.burst(p.x,p.y+18,'#e8d6b2',6);this.onEvent({type:'sound',sound:'jump'});}
    if(inp.swing&&!this.rope&&(!this.previous.swing||!this.wasSwing)){this.attach();this.wasSwing=!!this.rope;}
    if(inp.swing&&this.rope&&p.x>this.rope.x+100&&dir>0){const next=this.anchors.find(a=>a.x>p.x+70&&a.x<p.x+420&&a.y<p.y-45);if(next){this.rope=null;this.attach();this.wasSwing=!!this.rope;}}
    if(!inp.swing){if(this.rope){p.vx+=p.face*65;p.vy-=75;this.burst(p.x,p.y,'#fff4d0',5);}this.rope=null;this.wasSwing=false;}
    if(inp.shoot)this.shoot();
    const oldBottom=p.y+p.h/2;p.vy+=950*dt;p.vy=clamp(p.vy,-600,670);p.x+=p.vx*dt;p.y+=p.vy*dt;p.ground=false;
    if(this.rope){const r=this.rope;const dx=p.x-r.x,dy=p.y-r.y,d=Math.hypot(dx,dy);if(d>r.length){const nx=dx/d,ny=dy/d;p.x=r.x+nx*r.length;p.y=r.y+ny*r.length;const dot=p.vx*nx+p.vy*ny;if(dot>0){p.vx-=dot*nx;p.vy-=dot*ny;}}r.length=Math.max(150,r.length-35*dt);}
    p.x=clamp(p.x,18,this.config.length+250);p.y=Math.max(35,p.y);
    for(let i=0;i<this.platforms.length;i++){const platform=this.platforms[i];if(p.vy>=0&&oldBottom<=platform.y+7&&p.y+p.h/2>=platform.y&&p.x+p.w/2>platform.x&&p.x-p.w/2<platform.x+platform.w){p.y=platform.y-p.h/2;p.vy=0;p.ground=true;p.jumps=0;this.checkpoint=i;if(!platform.checkpoint){platform.checkpoint=true;if(i>0&&i%3===0)this.label(p.x,p.y-28,'CHECKPOINT','#f3e6ba');}break;}}
    if(p.y>660){this.hit();if(this.mode==='playing'){const plat=this.platforms[this.checkpoint];p.x=plat.x+45;p.y=plat.y-p.h/2;p.vx=0;p.vy=0;p.jumps=0;p.ground=true;this.rope=null;this.wasSwing=false;this.notify('Back on the roof. You’ve got this.');}}
    for(const item of this.pickups){if(!item.taken&&Math.hypot(item.x-p.x,item.y-p.y)<36){item.taken=true;this.collected++;this.score+=item.kind==='cell'?200:100;this.combo++;this.burst(item.x,item.y,item.kind==='cell'?'#79dff5':'#f8d982',14);this.label(item.x,item.y-20,'+'+(item.kind==='cell'?200:100));this.onEvent({type:'sound',sound:'collect'});this.onEvent({type:'hud'});}}
    for(const citizen of this.citizens){if(!citizen.rescued&&Math.abs(citizen.x-p.x)<55&&Math.abs(citizen.y-20-p.y)<65){citizen.rescued=true;this.collected++;this.score+=500;this.burst(citizen.x,citizen.y-20,'#ebd893',20);this.label(citizen.x,citizen.y-50,'NEIGHBOR SAVED!');this.notify(['“Thank you, Spider-Man!”','“My hero! And my neighbor.”','“I knew you’d come!”'][this.collected-1]);this.onEvent({type:'sound',sound:'rescue'});this.onEvent({type:'hud'});}}
    for(const e of this.enemies){if(e.dead)continue;e.phase+=dt*1.7;e.x=e.homeX+Math.sin(e.phase*.6)*50;e.y=e.baseY+Math.sin(e.phase)*24;e.timer-=dt;if(e.timer<=0&&Math.abs(e.x-p.x)<370){const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;this.bombs.push({x:e.x,y:e.y,vx:dx/d*125,vy:dy/d*125,life:3,kind:'laser'});e.timer=this.chapter>=2?2:3.8;}if(Math.hypot(e.x-p.x,e.y-p.y)<30)this.hit();}
    const boss=this.boss;if(boss&&boss.hp>0){boss.active=p.x>boss.homeX-600;if(boss.active){boss.phase+=dt;boss.x=boss.homeX+Math.sin(boss.phase*.8)*150;boss.y=210+Math.sin(boss.phase*1.6)*75;boss.timer-=dt;if(boss.timer<=0){const dx=p.x-boss.x,dy=p.y-boss.y,d=Math.hypot(dx,dy)||1;this.bombs.push({x:boss.x,y:boss.y+15,vx:dx/d*175,vy:dy/d*175,life:3,kind:'pumpkin'});boss.timer=boss.hp<8?.85:1.35;}if(Math.hypot(boss.x-p.x,boss.y-p.y)<48)this.hit();}}
    for(const shot of this.shots){shot.trail.unshift({x:shot.x,y:shot.y});if(shot.trail.length>5)shot.trail.pop();shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;for(const e of this.enemies){if(!e.dead&&Math.hypot(e.x-shot.x,e.y-shot.y)<30&&shot.life>0){e.hp--;shot.life=0;this.burst(e.x,e.y,'#c5eff0',12);if(e.hp<=0){e.dead=true;this.kills++;this.score+=250;this.label(e.x,e.y-30,'THWIP! +250');this.onEvent({type:'sound',sound:'defeat'});this.onEvent({type:'hud'});}}}if(boss?.active&&boss.hp>0&&shot.life>0&&Math.hypot(boss.x-shot.x,boss.y-shot.y)<48){boss.hp--;shot.life=0;this.burst(boss.x,boss.y,'#bed999',18);this.score+=150;this.shake=3;this.onEvent({type:'sound',sound:'defeat'});this.onEvent({type:'hud'});if(boss.hp===0){this.score+=2000;this.burst(boss.x,boss.y,'#f2bb65',60);this.label(boss.x,boss.y-45,'NEIGHBORHOOD: SAVED!');this.winDelay=1.3;}}}
    this.shots=this.shots.filter(s=>s.life>0);for(const bomb of this.bombs){bomb.x+=bomb.vx*dt;bomb.y+=bomb.vy*dt;bomb.life-=dt;if(Math.hypot(bomb.x-p.x,bomb.y-p.y)<23){this.hit();bomb.life=0;this.burst(bomb.x,bomb.y,bomb.kind==='pumpkin'?'#ec9c49':'#ef6b55',12);}if(bomb.kind==='pumpkin')bomb.vy+=65*dt;}this.bombs=this.bombs.filter(b=>b.life>0);
    this.camX+=(clamp(p.x-this.viewW*.38,0,Math.max(0,this.config.length-this.viewW+260))-this.camX)*Math.min(1,dt*6);this.camY+=(clamp(p.y-315,-100,45)-this.camY)*Math.min(1,dt*3);
    this.animateParticles(dt);this.previous={...inp};
    if(this.ready()&&!this.exitAnnounced){this.exitAnnounced=true;if(!boss)this.notify('Objective complete! Follow the green rooftop beacon →');}
    if(this.winDelay>0){this.winDelay-=dt;if(this.winDelay<=0)this.finish();}
    if(!boss&&this.ready()&&Math.abs(p.x-this.exit.x)<55&&Math.abs(p.y-(this.exit.y-20))<90)this.finish();
    if(this.config.limit&&this.elapsed>=this.config.limit&&this.mode==='playing'){this.mode='gameover';this.onEvent({type:'gameover',reason:'time'});}
  }
  animateParticles(dt){for(const pt of this.particles){pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.vy+=260*dt;pt.life-=dt;}this.particles=this.particles.filter(pt=>pt.life>0);for(const l of this.labels){l.y-=22*dt;l.life-=dt;}this.labels=this.labels.filter(l=>l.life>0);}
  finish(){if(this.mode!=='playing')return;this.mode='complete';this.score+=Math.max(0,Math.floor(1500-this.elapsed*5))+this.player.hp*200;this.onEvent({type:'complete',chapter:this.chapter,score:this.score,elapsed:this.elapsed});}
}
