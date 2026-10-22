(()=>{
const cover=document.querySelector('.cover-button'),disc=document.querySelector('.disc'),art=document.querySelector('.art'),hint=document.querySelector('.cover-hint');
const saver=document.querySelector('.screensaver'),logo=document.querySelector('.saver-logo'),page=document.querySelector('.page');
const bgChoice=document.querySelector('#background-choice'),saverChoice=document.querySelector('#saver-choice'),preview=document.querySelector('.preview-saver'),canvas=document.querySelector('.star-canvas'),ctx=canvas.getContext('2d');
let saverMode='bounce',stars=[],starWidth=0,starHeight=0;
function savePreferences(){try{localStorage.setItem('obskyra-desktop',JSON.stringify({background:bgChoice.value,saver:saverMode}));}catch{}}
try{const saved=JSON.parse(localStorage.getItem('obskyra-desktop')||'{}');if(['charcoal','hills','matrix'].includes(saved.background))bgChoice.value=saved.background;if(['bounce','stars'].includes(saved.saver))saverChoice.value=saved.saver;}catch{}
saverMode=saverChoice.value;document.body.dataset.background=bgChoice.value;
bgChoice.addEventListener('change',()=>{document.body.dataset.background=bgChoice.value;savePreferences();});
saverChoice.addEventListener('change',()=>{saverMode=saverChoice.value;savePreferences();});
preview.addEventListener('click',()=>{clearTimeout(idleTimer);show(true);});
function setupStars(){starWidth=innerWidth;starHeight=innerHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(starWidth*ratio);canvas.height=Math.round(starHeight*ratio);if(ctx)ctx.setTransform(ratio,0,0,ratio,0,0);stars=Array.from({length:160},()=>({x:(Math.random()-.5)*starWidth*2,y:(Math.random()-.5)*starHeight*2,z:.15+Math.random()*1.85}));}
function drawStars(dt){if(!ctx)return;ctx.fillStyle='#070908';ctx.fillRect(0,0,starWidth,starHeight);for(const star of stars){star.z-=dt*.26;if(star.z<=.08){star.z=2;star.x=(Math.random()-.5)*starWidth*2;star.y=(Math.random()-.5)*starHeight*2;}const px=star.x/star.z+starWidth/2,py=star.y/star.z+starHeight/2;const size=Math.max(.5,2.1-star.z);ctx.globalAlpha=Math.min(1,.3+1-star.z/2);ctx.fillStyle='#d7e9ff';ctx.beginPath();ctx.arc(px,py,size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let spin=null,playing=false,idleTimer,frame=0,last=0,active=false,previousFocus=null,x=30,y=30,vx=95,vy=72,color=0;
let pointerAnchor=null,lastPointer=null,movementBlockedUntil=0;
const MOVEMENT_THRESHOLD=16;
function meaningfulPointerMovement(e,now){
 const current={x:e.clientX,y:e.clientY};lastPointer=current;
 if(now<movementBlockedUntil||!pointerAnchor){pointerAnchor=current;return false;}
 return Math.hypot(current.x-pointerAnchor.x,current.y-pointerAnchor.y)>=MOVEMENT_THRESHOLD;
}
const colors=['#eaae43','#85c6a0','#87b9e0','#d999b9','#d3cd89'];
function syncDisc(){
 if(spin){spin.cancel();spin=null;}
 disc.style.transform='';
 if(playing){if(reduced.matches)disc.style.transform='rotate(25deg)';else{spin=disc.animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:2800,iterations:Infinity,easing:'linear'});if(active||document.hidden)spin.pause();}}
}
document.addEventListener('obskyra-music-state',e=>{playing=e.detail.playing;art.classList.toggle('is-playing',playing);cover.setAttribute('aria-pressed',String(playing));syncDisc();});
function bounds(){return {w:Math.max(0,innerWidth-logo.offsetWidth),h:Math.max(0,innerHeight-logo.offsetHeight-65)};}
function position(){logo.style.transform=`translate(${x}px,${y}px)`;}
function tick(now){
 if(!active)return;
 const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 if(saverMode==='stars'){drawStars(dt);frame=requestAnimationFrame(tick);return;}
 const b=bounds();x+=vx*dt;y+=vy*dt;let hit=false;
 if(x>=b.w){x=b.w;vx=-Math.abs(vx);hit=true;}else if(x<=0){x=0;vx=Math.abs(vx);hit=true;}
 if(y>=b.h){y=b.h;vy=-Math.abs(vy);hit=true;}else if(y<=0){y=0;vy=Math.abs(vy);hit=true;}
 if(hit)logo.style.color=colors[++color%colors.length];position();frame=requestAnimationFrame(tick);
}
function resetMotion(){cancelAnimationFrame(frame);last=0;if(saverMode==='stars'){setupStars();drawStars(0);if(active&&!reduced.matches)frame=requestAnimationFrame(tick);return;}const b=bounds();x=reduced.matches?b.w/2:Math.min(Math.max(0,x),b.w);y=reduced.matches?b.h/2:Math.min(Math.max(0,y),b.h);position();if(active&&!reduced.matches)frame=requestAnimationFrame(tick);}
function show(isPreview=false){if(document.hidden){arm();return;}active=true;movementBlockedUntil=performance.now()+(isPreview?1000:0);pointerAnchor=lastPointer?{...lastPointer}:null;previousFocus=document.activeElement;saver.dataset.mode=saverMode;saver.hidden=false;page.inert=true;saver.focus({preventScroll:true});if(spin)spin.pause();resetMotion();}
function hide(){active=false;cancelAnimationFrame(frame);saver.hidden=true;page.inert=false;if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});if(spin&&!document.hidden)spin.play();}
function arm(){clearTimeout(idleTimer);idleTimer=setTimeout(show,30000);}
function activity(e){
 if(e.type==='pointermove'){
  if(active){if(!meaningfulPointerMovement(e,performance.now()))return;}
  else lastPointer={x:e.clientX,y:e.clientY};
 }
 if(active){if(e.cancelable)e.preventDefault();e.stopImmediatePropagation();hide();}
 arm();
}
['pointermove','pointerdown','keydown','wheel','touchstart'].forEach(type=>window.addEventListener(type,activity,{capture:true,passive:false}));
window.addEventListener('scroll',()=>{if(!active)arm();},{passive:true});
saver.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(active)hide();arm();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(idleTimer);if(active)hide();if(spin)spin.pause();}else{if(spin)spin.play();arm();}});
window.addEventListener('resize',()=>{if(active)resetMotion();});
reduced.addEventListener('change',()=>{syncDisc();if(active)resetMotion();});arm();

const sticker=document.querySelector('.age-reveal .sticker'),ageNumber=document.querySelector('.age-number');
const ageDateFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'numeric',day:'numeric'});
function ageOnDate(year,month,day){return year-2006-((month<9||(month===9&&day<5))?1:0);}
function updateAge(){const date=Object.fromEntries(ageDateFormatter.formatToParts(new Date()).map(p=>[p.type,p.value]));const age=ageOnDate(Number(date.year),Number(date.month),Number(date.day));ageNumber.textContent=String(age);ageNumber.setAttribute('aria-label',String(age)+' years old');}
updateAge();setInterval(updateAge,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateAge();});
let dragPointer=null,dragOrigin=null,dragX=0,dragY=0,dragAngle=0,stickerGone=false,returnTimer=null;
const PEEL_DISTANCE=38;
function dragDistance(x,y){return Math.hypot(x,y);}
function paintSticker(){
 const distance=dragDistance(dragX,dragY);dragAngle=Math.max(-24,Math.min(24,dragX*.14+dragY*.06));
 sticker.style.setProperty('--drag-x',dragX+'px');sticker.style.setProperty('--drag-y',dragY+'px');sticker.style.setProperty('--drag-angle',dragAngle+'deg');sticker.style.setProperty('--curl',Math.min(64,distance*.7)+'px');
}
function removeSticker(){sticker.hidden=true;if(document.activeElement===sticker)cover.focus({preventScroll:true});}
function dropSticker(){
 stickerGone=true;sticker.classList.add('falling');sticker.closest('.age-reveal').classList.add('revealed');
 const transform=`translate3d(${dragX}px,${dragY}px,0) rotate(${dragAngle}deg)`;
 const anim=sticker.animate(reduced.matches?[{transform,opacity:1},{transform,opacity:0}]:[
 {transform,opacity:1,offset:0},
 {transform:`translate3d(${dragX+12}px,${dragY+28}px,0) rotate(${dragAngle+24}deg)`,opacity:1,offset:.3},
 {transform:`translate3d(${dragX+40}px,${dragY+220}px,0) rotate(${dragAngle+105}deg)`,opacity:0,offset:1}
 ],{duration:reduced.matches?200:700,easing:'cubic-bezier(.35,0,.8,.55)',fill:'forwards'});
 anim.finished.then(removeSticker).catch(removeSticker);
}
function returnSticker(){
 sticker.classList.remove('dragging');sticker.classList.add('returning');dragX=0;dragY=0;paintSticker();
 returnTimer=setTimeout(()=>sticker.classList.remove('returning'),270);
}
function followSticker(e){
 if(stickerGone||e.pointerId!==dragPointer||!dragOrigin)return;
 dragX=e.clientX-dragOrigin.x;dragY=e.clientY-dragOrigin.y;paintSticker();
}
sticker.addEventListener('pointerdown',e=>{
 if(stickerGone||dragPointer!==null||e.button!==0)return;
 e.preventDefault();clearTimeout(returnTimer);sticker.classList.remove('returning');
 dragPointer=e.pointerId;dragOrigin={x:e.clientX-dragX,y:e.clientY-dragY};
 sticker.classList.add('dragging');sticker.setPointerCapture(e.pointerId);
});
function finishDrag(e,cancelled=false){
 if(e.pointerId!==dragPointer)return;
 if(!cancelled)followSticker(e);
 const pointer=dragPointer;dragPointer=null;dragOrigin=null;
 if(sticker.hasPointerCapture(pointer))sticker.releasePointerCapture(pointer);
 if(!cancelled&&dragDistance(dragX,dragY)>=PEEL_DISTANCE)dropSticker();else returnSticker();
}
sticker.addEventListener('pointermove',followSticker);
sticker.addEventListener('pointerup',e=>finishDrag(e));
sticker.addEventListener('pointercancel',e=>finishDrag(e,true));
sticker.addEventListener('lostpointercapture',e=>finishDrag(e,true));
sticker.addEventListener('dragstart',e=>e.preventDefault());
// Keyboard equivalent: hold Space and pull with the arrow keys, then release Space.
let keyboardDrag=false;
sticker.addEventListener('keydown',e=>{
 if(stickerGone)return;
 if(e.code==='Space'){e.preventDefault();keyboardDrag=true;sticker.classList.add('dragging');}
 if(keyboardDrag&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
 e.preventDefault();dragX+=e.key==='ArrowLeft'?-12:e.key==='ArrowRight'?12:0;dragY+=e.key==='ArrowUp'?-12:e.key==='ArrowDown'?12:0;paintSticker();
 }
});
sticker.addEventListener('keyup',e=>{if(e.code==='Space'&&keyboardDrag){e.preventDefault();keyboardDrag=false;if(dragDistance(dragX,dragY)>=PEEL_DISTANCE)dropSticker();else returnSticker();}});


const companion=document.querySelector('.companion'),companionButton=companion.querySelector('button'),sprite=companion.querySelector('canvas'),bubble=companion.querySelector('.companion-bubble');
const spriteContext=sprite.getContext('2d');
const frameBounds={"reactions": [{"x": 52, "y": 9, "w": 144, "h": 329, "anchorX": 123, "baseline": 336, "scale": 1.04}, {"x": 279, "y": 9, "w": 144, "h": 329, "anchorX": 350, "baseline": 336, "scale": 1.04}, {"x": 503, "y": 9, "w": 144, "h": 329, "anchorX": 575, "baseline": 336, "scale": 1.04}, {"x": 730, "y": 9, "w": 143, "h": 329, "anchorX": 801, "baseline": 336, "scale": 1.04}, {"x": 35, "y": 348, "w": 161, "h": 328, "anchorX": 123, "baseline": 674, "scale": 1.04}, {"x": 250, "y": 348, "w": 180, "h": 328, "anchorX": 350, "baseline": 674, "scale": 1.04}, {"x": 479, "y": 349, "w": 166, "h": 327, "anchorX": 575, "baseline": 674, "scale": 1.04}, {"x": 731, "y": 347, "w": 144, "h": 329, "anchorX": 801, "baseline": 674, "scale": 1.04}, {"x": 29, "y": 685, "w": 191, "h": 325, "anchorX": 123, "baseline": 1008, "scale": 1.04}, {"x": 253, "y": 685, "w": 193, "h": 321, "anchorX": 350, "baseline": 1008, "scale": 1.04}, {"x": 472, "y": 685, "w": 202, "h": 324, "anchorX": 575, "baseline": 1008, "scale": 1.04}, {"x": 703, "y": 687, "w": 197, "h": 308, "anchorX": 801, "baseline": 1008, "scale": 1.04}, {"x": 8, "y": 1027, "w": 231, "h": 264, "anchorX": 123, "baseline": 1325, "scale": 1.04}, {"x": 241, "y": 1027, "w": 219, "h": 298, "anchorX": 350, "baseline": 1325, "scale": 1.04}, {"x": 461, "y": 1039, "w": 222, "h": 287, "anchorX": 575, "baseline": 1325, "scale": 1.04}, {"x": 693, "y": 1058, "w": 218, "h": 269, "anchorX": 801, "baseline": 1325, "scale": 1.04}, {"x": 38, "y": 1414, "w": 169, "h": 252, "anchorX": 123, "baseline": 1664, "scale": 1.04}, {"x": 265, "y": 1361, "w": 180, "h": 303, "anchorX": 350, "baseline": 1664, "scale": 1.04}, {"x": 503, "y": 1335, "w": 140, "h": 330, "anchorX": 575, "baseline": 1664, "scale": 1.04}, {"x": 731, "y": 1335, "w": 141, "h": 330, "anchorX": 801, "baseline": 1664, "scale": 1.04}], "walking": [{"x": 54, "y": 29, "w": 269, "h": 468, "anchorX": 192.0, "baseline": 497, "scale": 0.72}, {"x": 465, "y": 29, "w": 212, "h": 469, "anchorX": 576.0, "baseline": 497, "scale": 0.72}, {"x": 846, "y": 29, "w": 209, "h": 471, "anchorX": 960.0, "baseline": 497, "scale": 0.72}, {"x": 1201, "y": 29, "w": 281, "h": 470, "anchorX": 1344.0, "baseline": 497, "scale": 0.72}, {"x": 46, "y": 534, "w": 288, "h": 460, "anchorX": 192.0, "baseline": 996, "scale": 0.72}, {"x": 469, "y": 537, "w": 208, "h": 462, "anchorX": 576.0, "baseline": 996, "scale": 0.72}, {"x": 856, "y": 537, "w": 208, "h": 462, "anchorX": 960.0, "baseline": 996, "scale": 0.72}, {"x": 1200, "y": 534, "w": 294, "h": 462, "anchorX": 1344.0, "baseline": 996, "scale": 0.72}]};
frameBounds.clicks=[{"x": 63, "y": 30, "w": 164, "h": 361, "anchorX": 128.0, "baseline": 389, "scale": 0.94678}, {"x": 264, "y": 28, "w": 244, "h": 363, "anchorX": 384.0, "baseline": 389, "scale": 0.94678}, {"x": 533, "y": 28, "w": 219, "h": 363, "anchorX": 640.0, "baseline": 389, "scale": 0.94678}, {"x": 798, "y": 30, "w": 165, "h": 361, "anchorX": 896.0, "baseline": 389, "scale": 0.94678}, {"x": 61, "y": 404, "w": 167, "h": 361, "anchorX": 128.0, "baseline": 763, "scale": 0.94678}, {"x": 302, "y": 404, "w": 174, "h": 361, "anchorX": 384.0, "baseline": 763, "scale": 0.94678}, {"x": 557, "y": 403, "w": 170, "h": 362, "anchorX": 640.0, "baseline": 763, "scale": 0.94678}, {"x": 800, "y": 404, "w": 164, "h": 361, "anchorX": 896.0, "baseline": 763, "scale": 0.94678}, {"x": 62, "y": 776, "w": 165, "h": 361, "anchorX": 128.0, "baseline": 1135, "scale": 0.94678}, {"x": 302, "y": 775, "w": 169, "h": 362, "anchorX": 384.0, "baseline": 1135, "scale": 0.94678}, {"x": 551, "y": 776, "w": 170, "h": 361, "anchorX": 640.0, "baseline": 1135, "scale": 0.94678}, {"x": 768, "y": 776, "w": 226, "h": 361, "anchorX": 896.0, "baseline": 1135, "scale": 0.94678}, {"x": 61, "y": 1146, "w": 166, "h": 362, "anchorX": 128.0, "baseline": 1507, "scale": 0.94413}, {"x": 294, "y": 1146, "w": 185, "h": 363, "anchorX": 384.0, "baseline": 1507, "scale": 0.94413}, {"x": 521, "y": 1146, "w": 243, "h": 363, "anchorX": 640.0, "baseline": 1507, "scale": 0.94413}, {"x": 799, "y": 1146, "w": 165, "h": 363, "anchorX": 896.0, "baseline": 1507, "scale": 0.94413}];
const sheets={clicks:{src:"assets/companion/click-reactions-v4.webp",frames:frameBounds.clicks},left:{src:"assets/companion/walk-v3.webp",frames:frameBounds.walking},right:{src:"assets/companion/walk-v3.webp",frames:frameBounds.walking,mirror:true},reactions:{src:"assets/companion/reactions-v3.webp",frames:frameBounds.reactions}};
const actions={shrug:{sheet:'clicks',start:0,count:4,fps:3,loop:false},laugh:{sheet:'clicks',start:4,count:4,fps:3,loop:false},annoyed:{sheet:'clicks',start:8,count:4,fps:2.5,loop:false},cheer:{sheet:'clicks',start:12,count:4,fps:3,loop:false},idle:{sheet:'reactions',start:0,count:4,fps:3,loop:true},click:{sheet:'reactions',start:4,count:4,fps:6,loop:false},grabbed:{sheet:'reactions',start:8,count:4,fps:7,loop:true},falling:{sheet:'reactions',start:12,count:4,fps:8,loop:false},landing:{sheet:'reactions',start:16,count:4,fps:5,loop:false},left:{sheet:'left',start:0,count:8,fps:8,loop:true},right:{sheet:'right',start:0,count:8,fps:8,loop:true}};
const lines={"click": ["I'm working!", "You rang?", "Oh, hi again.", "Yep. Still here.", "Need something?", "You found the tiny me."], "shrug": ["What do you want me to do?", "I just live down here.", "Your guess is as good as mine.", "Was that the plan?", "I don't make the rules.", "I'm a little guy, not tech support."], "laugh": ["Alright, that got me.", "You're easily entertained.", "Okay, one more.", "This is my job now, apparently.", "We're both avoiding something, aren't we?", "You clicked. I did a thing. Fair trade."], "annoyed": ["Again? Really?", "I was in the middle of standing here.", "Have you tried clicking Twitch?", "I'm not a doorbell.", "My personal space is about twelve pixels.", "Go on. Get it out of your system."], "cheer": ["There we go!", "Big moment for a small guy.", "Nailed it.", "That's the spirit!", "I'd high-five you, but... screen.", "I'll count that as a win."], "grab": ["Put me down!", "Not the hair!", "Where are we going?", "I can walk, you know.", "Ground. Big fan of the ground.", "This wasn't in the job description.", "Careful with the merchandise!", "Taxi service is getting weird."], "drop": ["I felt that.", "Careful!", "I'll pretend that didn't happen.", "Stuck the landing. Mostly.", "Yep. That's a floor.", "My knees would like a word.", "Could've used a parachute.", "Still in one piece."], "air": ["Still up here, by the way.", "The floor is looking pretty good.", "Are we there yet?", "You can put me down now."]};
const lineIndex=Object.fromEntries(Object.keys(lines).map(key=>[key,0]));
const clickActions=["click","shrug","laugh","annoyed","cheer"];let clickActionIndex=0;
let nextAirLine=Infinity;
const tossPhysics={gravity:1800,drag:5,maxX:170,maxUp:220,maxDown:260,strength:.2,maxTravel:40};
let tossSpeedX=0,tossOriginX=0,dragSamples=[],lastDragMotion=-Infinity;
function pointerTime(e){return Number.isFinite(e.timeStamp)?e.timeStamp:clock*1000;}
function sampleDrag(e){const time=pointerTime(e),last=dragSamples[dragSamples.length-1];if(last&&(Math.abs(last.x-posX)>.1||Math.abs(last.y-posY)>.1))lastDragMotion=time;dragSamples.push({x:posX,y:posY,time});dragSamples=dragSamples.filter(p=>time-p.time<=120);}
function releaseMomentum(e){
 const now=pointerTime(e),ratio=companion.offsetWidth/128;
 if(e.type==='pointercancel'||e.type==='lostpointercapture'||now-lastDragMotion>90||dragSamples.length<2)return {x:0,y:0};
 const recent=dragSamples.filter(p=>now-p.time<=120),first=recent[0],last=recent[recent.length-1];
 if(!first||!last||last.time-first.time<8)return {x:0,y:0};
 const seconds=Math.max(.016,(now-first.time)/1000),x=(last.x-first.x)/seconds*tossPhysics.strength,y=(last.y-first.y)/seconds*tossPhysics.strength;
 return {x:Math.max(-tossPhysics.maxX*ratio,Math.min(tossPhysics.maxX*ratio,x)),y:Math.max(-tossPhysics.maxUp*ratio,Math.min(tossPhysics.maxDown*ratio,y))};
}
let speechTimer,held=null,origin=null,dragged=false,suppressClick=false,currentAction='idle',actionTime=0,lastFrameKey='',lastTime=0,posX=0,posY=0,fallSpeed=0,walkTarget=0,nextWalk=8,clock=0;
function limits(){return {maxX:Math.max(0,innerWidth-companion.offsetWidth),floor:Math.max(0,innerHeight-companion.offsetHeight-10)};}
function place(){companion.style.left=posX+'px';companion.style.top=posY+'px';bubble.style.left=(Math.max(5,Math.min(innerWidth-185,posX+companion.offsetWidth-180))-posX)+'px';bubble.style.right='auto';bubble.style.bottom=posY<85?'auto':'calc(100% + 5px)';bubble.style.top=posY<85?'calc(100% + 5px)':'auto';}
function setAction(name){currentAction=name;actionTime=0;lastFrameKey='';companion.dataset.action=name;}
function speak(kind){clearTimeout(speechTimer);bubble.textContent=lines[kind][lineIndex[kind]++%lines[kind].length];bubble.hidden=false;speechTimer=setTimeout(()=>bubble.hidden=true,3200);}
function renderFrame(){
 const action=actions[currentAction],sheet=sheets[action.sheet];if(!sheet.ready||!spriteContext)return;
 const offset=reduced.matches?0:(action.loop?Math.floor(actionTime*action.fps)%action.count:Math.min(action.count-1,Math.floor(actionTime*action.fps)));
 const index=action.start+(reduced.matches&&clickActions.includes(currentAction)?2:offset),key=currentAction+':'+index;if(key===lastFrameKey)return;lastFrameKey=key;
 const frame=sheet.frames[index];
 spriteContext.clearRect(0,0,sprite.width,sprite.height);
 spriteContext.save();if(sheet.mirror){spriteContext.translate(sprite.width,0);spriteContext.scale(-1,1);}
 spriteContext.drawImage(sheet.image,frame.x,frame.y,frame.w,frame.h,128+(frame.x-frame.anchorX)*frame.scale,380+(frame.y-frame.baseline)*frame.scale,frame.w*frame.scale,frame.h*frame.scale);
 spriteContext.restore();
}
const sheetImages={};
function loadSheets(){for(const sheet of Object.values(sheets)){
 if(!sheet.src)continue;
 let img=sheetImages[sheet.src];
 if(!img){img=new Image();img.decoding='async';sheetImages[sheet.src]=img;img.src=sheet.src;}
 sheet.image=img;
 const ready=()=>{sheet.ready=true;lastFrameKey='';renderFrame();};
 const decoded=()=>(img.decode?img.decode().catch(()=>{}):Promise.resolve()).then(ready);
 if(img.complete&&img.naturalWidth)decoded();else img.addEventListener('load',decoded,{once:true});
}}
{const startSheets=()=>('requestIdleCallback' in window?requestIdleCallback(loadSheets,{timeout:2500}):setTimeout(loadSheets,300));if(document.readyState==='complete')startSheets();else addEventListener('load',startSheets,{once:true});}
function land(){posY=limits().floor;fallSpeed=0;tossSpeedX=0;setAction('landing');speak('drop');nextWalk=clock+6;place();}
function step(now){
 const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;
 if(!document.hidden&&!active){
 clock+=dt;
 if(held!==null&&dragged&&posY<limits().floor-24&&clock>=nextAirLine){speak('air');nextAirLine=clock+6;}
 if(currentAction!=='left'&&currentAction!=='right')actionTime+=dt;
 if(currentAction==='falling'&&held===null){
  const ratio=companion.offsetWidth/128,bounds=limits(),gravity=tossPhysics.gravity*ratio;
  posY+=fallSpeed*dt+.5*gravity*dt*dt;fallSpeed+=gravity*dt;
  const decay=Math.exp(-tossPhysics.drag*dt);posX+=tossSpeedX*(1-decay)/tossPhysics.drag;tossSpeedX*=decay;
  const maxTravel=tossPhysics.maxTravel*ratio;posX=Math.max(0,Math.min(bounds.maxX,Math.max(tossOriginX-maxTravel,Math.min(tossOriginX+maxTravel,posX))));
  if(posX===0||posX===bounds.maxX||Math.abs(posX-tossOriginX)>=maxTravel)tossSpeedX=0;
  if(posY<0){posY=0;fallSpeed=Math.max(0,fallSpeed);}
  if(posY>=bounds.floor)land();place();
 }else if((currentAction==='left'||currentAction==='right')&&held===null){
  const delta=walkTarget-posX,sizeRatio=companion.offsetWidth/128,travel=Math.min(Math.abs(delta),72*sizeRatio*dt);
  posX+=Math.sign(delta)*travel;actionTime+=travel/(86*sizeRatio);
  if(Math.abs(walkTarget-posX)<.1){posX=walkTarget;setAction('idle');nextWalk=clock+6+Math.random()*5;}place();
 }else if((clickActions.includes(currentAction)||currentAction==='landing')&&actionTime>=actions[currentAction].count/actions[currentAction].fps){setAction('idle');nextWalk=clock+8;}
 else if(currentAction==='idle'&&held===null&&!reduced.matches&&clock>=nextWalk){
  const min=0,max=limits().maxX;
  walkTarget=Math.max(min,Math.min(max,posX+(posX>(min+max)/2?-1:1)*(90+Math.random()*130)));
  if(Math.abs(walkTarget-posX)>10)setAction(walkTarget<posX?'left':'right');else nextWalk=clock+6;
 }
 renderFrame();
 }
 requestAnimationFrame(step);
}
companionButton.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}if(currentAction==='falling'){speak('click');return;}const choice=clickActions[clickActionIndex++%clickActions.length];const selected=choice==='click'||sheets.clicks.ready?choice:'click';setAction(selected);speak(selected);nextWalk=clock+10;renderFrame();});
companionButton.addEventListener('pointerdown',e=>{
 if(e.button!==0||held!==null)return;e.preventDefault();held=e.pointerId;origin={x:e.clientX,y:e.clientY,startX:posX,startY:posY};dragged=false;suppressClick=false;dragSamples=[];lastDragMotion=-Infinity;sampleDrag(e);companionButton.setPointerCapture(e.pointerId);if(currentAction==='left'||currentAction==='right')setAction('idle');renderFrame();
});
companionButton.addEventListener('pointermove',e=>{
 if(e.pointerId!==held)return;const dx=e.clientX-origin.x,dy=e.clientY-origin.y;
 if(!dragged&&Math.hypot(dx,dy)>=10){dragged=true;companionButton.classList.add('held');setAction('grabbed');speak('grab');nextAirLine=clock+5;renderFrame();}
 if(dragged){const bounds=limits();posX=Math.max(0,Math.min(bounds.maxX,origin.startX+dx));posY=Math.max(0,Math.min(bounds.floor,origin.startY+dy));sampleDrag(e);place();}
});
function finishCompanionDrag(e){
 if(e.pointerId!==held)return;const id=held;held=null;nextAirLine=Infinity;companionButton.classList.remove('held');if(companionButton.hasPointerCapture(id))companionButton.releasePointerCapture(id);suppressClick=dragged;
 if(!dragged){nextWalk=clock+10;return;}
 bubble.hidden=true;clearTimeout(speechTimer);if(reduced.matches){land();}else{const momentum=releaseMomentum(e);setAction('falling');fallSpeed=momentum.y;tossSpeedX=momentum.x;tossOriginX=posX;}dragSamples=[];renderFrame();
}
companionButton.addEventListener('pointerup',finishCompanionDrag);companionButton.addEventListener('pointercancel',finishCompanionDrag);companionButton.addEventListener('lostpointercapture',finishCompanionDrag);companionButton.addEventListener('dragstart',e=>e.preventDefault());
window.addEventListener('resize',()=>{const bounds=limits();posX=Math.min(posX,bounds.maxX);walkTarget=Math.min(walkTarget,bounds.maxX);if(held===null&&currentAction!=='falling')posY=bounds.floor;else posY=Math.min(posY,bounds.floor);place();});
reduced.addEventListener('change',()=>{if(reduced.matches&&held===null){posY=limits().floor;setAction('idle');place();}lastFrameKey='';renderFrame();});
posX=Math.max(0,limits().maxX-18);posY=limits().floor;place();companion.dataset.action='idle';requestAnimationFrame(step);



})();
;
(()=>{const c=document.querySelector('.cover-button');if(!c)return;let on=false;c.addEventListener('click',()=>{on=!on;document.dispatchEvent(new CustomEvent('obskyra-music-state',{detail:{playing:on}}));});})();
