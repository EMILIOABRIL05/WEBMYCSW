AOS.init({ duration:700, once:true });

/* ============================================================
   DIFICULTADES
   ============================================================ */
const DIFFICULTIES = [
    { name:'Facil',   drawN:1, maxRedraws:Infinity, timer:false, mult:1.0 },
    { name:'Normal',  drawN:3, maxRedraws:Infinity, timer:false, mult:1.5 },
    { name:'Dificil', drawN:3, maxRedraws:3,        timer:false, mult:2.0 },
    { name:'Experto', drawN:3, maxRedraws:1,        timer:true,  mult:3.0 },
];
let diffIndex = Math.min(parseInt(localStorage.getItem('solitaire-diff') || '0'), 3);

/* ============================================================
   CONSTANTES
   ============================================================ */
const SUITS  = ['hearts','diamonds','clubs','spades'];
const SYM    = { hearts:'&#9829;', diamonds:'&#9830;', clubs:'&#9827;', spades:'&#9824;' };
const SYMTX  = { hearts:'\u2665', diamonds:'\u2666', clubs:'\u2663', spades:'\u2660' };
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

/* ============================================================
   ESTADO
   ============================================================ */
let stockArr=[], wasteArr=[], found=[[],[],[],[]], tab=[[],[],[],[],[],[],[]];
let moves=0, score=0, redraws=0, timerSecs=0, timerID=null, gameOver=false;
let history=[];

/* ============================================================
   UTILIDADES
   ============================================================ */
function cardW(){ return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-w'))||72; }
function cardH(){ return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-h'))||108; }

function saveState(){
    history.push(JSON.stringify({stockArr,wasteArr,found,tab,moves,score,redraws}));
    if(history.length>60) history.shift();
}

function buildCardEl(c, src, idx, cidx){
    const el = document.createElement('div');
    if(!c.face){
        el.className='card face-down';
        return el;
    }
    el.className='card '+(c.red?'red':'blk');
    el.dataset.id=c.id; el.dataset.src=src;
    if(idx!==undefined) el.dataset.sidx=idx;
    if(cidx!==undefined) el.dataset.cidx=cidx;
    el.innerHTML=
        '<div class="cv-top">'+c.val+'<br><span style="font-size:10px">'+SYMTX[c.suit]+'</span></div>'+ 
        '<div class="cs-mid">'+SYMTX[c.suit]+'</div>'+ 
        '<div class="cv-bot">'+c.val+'<br><span style="font-size:10px">'+SYMTX[c.suit]+'</span></div>';
    return el;
}

/* ============================================================
   RENDER
   ============================================================ */
function render(){
    renderStock(); renderWaste(); renderFoundations(); renderTableau();
    updateUI(); if(!gameOver) checkWin();
}

function renderStock(){
    const z=document.getElementById('stock-zone');
    z.querySelectorAll('.card').forEach(e=>e.remove());
    const icon=document.getElementById('stock-icon');
    if(stockArr.length){
        const el=document.createElement('div');
        el.className='card face-down';
        el.style.cssText='position:absolute;top:0;left:0;';
        z.appendChild(el);
        icon.style.display='none';
    } else {
        icon.style.display='';
    }
}

function renderWaste(){
    const z=document.getElementById('waste-zone');
    z.querySelectorAll('.card').forEach(e=>e.remove());
    const icon=z.querySelector('.zone-icon');
    if(!wasteArr.length){ if(icon) icon.style.display=''; return; }
    if(icon) icon.style.display='none';
    const diff=DIFFICULTIES[diffIndex];
    const show=Math.min(3,wasteArr.length);
    const start=wasteArr.length-show;
    for(let i=start;i<wasteArr.length;i++){
        const c=wasteArr[i];
        const isTop=(i===wasteArr.length-1);
        const el=buildCardEl(c,'waste',i);
        const offset=(diff.drawN>1)?(i-start)*18:0;
        el.style.cssText='position:absolute;top:0;left:'+offset+'px;z-index:'+(i-start+1)+';';
        if(!isTop) el.style.pointerEvents='none';
        if(isTop){ attachDrag(el,'waste',null,null); }
        z.appendChild(el);
    }
    // dblclick waste top
    z.querySelectorAll('.card:not(.face-down)').forEach((e,i,arr)=>{
        if(i===arr.length-1) e.addEventListener('dblclick',()=>tryAutoFoundation('waste',null));
    });
}

function renderFoundations(){
    for(let fi=0;fi<4;fi++){
        const z=document.getElementById('f'+fi);
        z.querySelectorAll('.card').forEach(e=>e.remove());
        const icon=z.querySelector('.zone-icon');
        const pile=found[fi];
        if(!pile.length){ if(icon) icon.style.display=''; continue; }
        if(icon) icon.style.display='none';
        const c=pile[pile.length-1];
        const el=buildCardEl(c,'f',fi,pile.length-1);
        el.style.cssText='position:absolute;top:0;left:0;';
        z.appendChild(el);
    }
}

function renderTableau(){
    const ODOWN=16, OFACE=28;
    for(let ti=0;ti<7;ti++){
        const pileEl=document.getElementById('t'+ti);
        pileEl.innerHTML='';
        const col=tab[ti];
        if(!col.length){ pileEl.style.minHeight=cardH()+'px'; continue; }
        let y=0;
        const offs=col.map(c=>{ const o=y; y+=(c.face?OFACE:ODOWN); return o; });
        const totalH=offs[col.length-1]+(col[col.length-1].face?cardH():ODOWN);
        pileEl.style.height=totalH+'px';
        pileEl.style.minHeight=totalH+'px';
        for(let j=0;j<col.length;j++){
            const c=col[j];
            const el=buildCardEl(c,'t',ti,j);
            el.style.cssText='position:absolute;top:'+offs[j]+'px;left:0;z-index:'+(j+1)+';';
            if(c.face){
                attachDrag(el,'t',ti,j);
                el.addEventListener('dblclick',e=>{
                    e.stopPropagation();
                    if(parseInt(el.dataset.cidx)!==tab[ti].length-1) return;
                    tryAutoFoundation('t',ti);
                });
            }
            pileEl.appendChild(el);
        }
    }
}

/* ============================================================
   STATS
   ============================================================ */
function updateUI(){
    document.getElementById('stat-moves').textContent=moves;
    document.getElementById('stat-score').textContent=score;
    const diff=DIFFICULTIES[diffIndex];
    const left=diff.maxRedraws===Infinity?'inf':Math.max(0,diff.maxRedraws-redraws);
    document.getElementById('stat-draws').textContent=left;
}

/* ============================================================
   TIMER
   ============================================================ */
function startTimer(){ timerID=setInterval(()=>{
    timerSecs++;
    document.getElementById('stat-timer').textContent=
        String(Math.floor(timerSecs/60)).padStart(2,'0')+':'+String(timerSecs%60).padStart(2,'0');
},1000); }
function stopTimer(){ if(timerID){clearInterval(timerID);timerID=null;} }

/* ============================================================
   INICIO DEL JUEGO
   ============================================================ */
window.startGame=function(){
    document.getElementById('win-modal').classList.add('hidden');
    document.getElementById('lose-modal').classList.add('hidden');
    gameOver=false; history=[]; moves=0; score=0; redraws=0;
    stopTimer(); timerSecs=0;

    const diff=DIFFICULTIES[diffIndex];
    document.getElementById('diff-badge').textContent=diff.name.toUpperCase();
    document.querySelectorAll('#diff-panel .btn-rz').forEach(b=>
        b.classList.toggle('active',parseInt(b.dataset.diff)===diffIndex));
    updateUI();

    const tw=document.getElementById('timer-wrap');
    if(diff.timer){ tw.classList.remove('hidden'); startTimer(); }
    else { tw.classList.add('hidden'); }

    // Crear mazo
    let deck=[];
    for(let s of SUITS) for(let i=0;i<13;i++){
        deck.push({suit:s,val:VALUES[i],num:i+1,red:s==='hearts'||s==='diamonds',face:false,id:s+'-'+VALUES[i]});
    }
    // Barajar Fisher-Yates
    for(let i=deck.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [deck[i],deck[j]]=[deck[j],deck[i]];
    }

    // Repartir
    let ci=0; tab=[];
    for(let col=0;col<7;col++){
        const pile=[];
        for(let row=0;row<=col;row++){
            const c={...deck[ci++]};
            c.face=(row===col);
            pile.push(c);
        }
        tab.push(pile);
    }
    stockArr=deck.slice(ci).map(c=>({...c,face:false}));
    wasteArr=[]; found=[[],[],[],[]];
    render();
};

/* ============================================================
   STOCK CLICK
   ============================================================ */
window.clickStock=function(){
    if(gameOver) return;
    const diff=DIFFICULTIES[diffIndex];
    if(stockArr.length===0){
        if(redraws>=diff.maxRedraws){ showToast('Sin repasos disponibles'); checkStuck(); return; }
        saveState();
        while(wasteArr.length){ const c=wasteArr.pop(); c.face=false; stockArr.push(c); }
        redraws++; score=Math.max(0,score-15); moves++;
        render(); return;
    }
    saveState();
    const n=Math.min(diff.drawN,stockArr.length);
    for(let i=0;i<n;i++){ const c=stockArr.pop(); c.face=true; wasteArr.push(c); }
    moves++; render();
};

/* ============================================================
   AUTO FOUNDATION (dblclick)
   ============================================================ */
function tryAutoFoundation(src,idx){
    let card,srcArr,srcIdx;
    if(src==='waste'){
        if(!wasteArr.length) return false;
        srcArr=wasteArr; srcIdx=wasteArr.length-1; card=wasteArr[srcIdx];
    } else {
        srcArr=tab[idx]; srcIdx=srcArr.length-1; card=srcArr[srcIdx];
    }
    if(!card||!card.face) return false;
    for(let fi=0;fi<4;fi++){
        if(canDropF(card,fi)){
            saveState();
            srcArr.splice(srcIdx,1);
            if(src==='t'&&srcArr.length&&!srcArr[srcArr.length-1].face){
                srcArr[srcArr.length-1].face=true; score+=5;
            }
            found[fi].push(card);
            score+=Math.round(10*DIFFICULTIES[diffIndex].mult);
            moves++; render(); return true;
        }
    }
    return false;
}

/* ============================================================
   VALIDACION
   ============================================================ */
function canDropF(card,fi){
    const p=found[fi];
    if(!p.length) return card.num===1;
    const t=p[p.length-1];
    return card.suit===t.suit && card.num===t.num+1;
}
function canDropT(cards,ti){
    const col=tab[ti];
    const bot=cards[0];
    if(!col.length) return bot.num===13;
    const top=col[col.length-1];
    if(!top.face) return false;
    return (bot.red!==top.red)&&(bot.num===top.num-1);
}

/* ============================================================
   DRAG & DROP (mouse)
   ============================================================ */
let ds=null; // drag state

function attachDrag(el,srcType,idx,cidx){
    el.addEventListener('mousedown',e=>{
        if(e.button!==0) return;
        e.preventDefault(); e.stopPropagation();
        let cards=[];
        if(srcType==='waste') cards=[wasteArr[wasteArr.length-1]];
        else if(srcType==='f'){ const fi=idx!==null?idx:parseInt(el.dataset.sidx); cards=[found[fi][found[fi].length-1]]; }
        else { const ci=parseInt(el.dataset.cidx); cards=tab[idx].slice(ci); }
        if(!cards.length) return;

        const rect=el.getBoundingClientRect();
        const cw=rect.width, ch=rect.height;
        
        const ghost=document.getElementById('drag-ghost');
        ghost.innerHTML='';
        const wrap=document.createElement('div');
        wrap.style.cssText='position:relative;width:'+cw+'px;height:'+(ch+(cards.length-1)*28)+'px;';
        cards.forEach((c,i)=>{
            const ge=document.createElement('div');
            ge.className='card '+(c.red?'red':'blk');
            ge.style.cssText='position:absolute;top:'+(i*28)+'px;left:0;width:'+cw+'px;height:'+ch+'px;';
            ge.innerHTML=
                '<div class="cv-top">'+c.val+'<br><span style="font-size:10px">'+SYMTX[c.suit]+'</span></div>'+ 
                '<div class="cs-mid">'+SYMTX[c.suit]+'</div>'+ 
                '<div class="cv-bot">'+c.val+'<br><span style="font-size:10px">'+SYMTX[c.suit]+'</span></div>';
            wrap.appendChild(ge);
        });
        ghost.appendChild(wrap);
        ghost.style.display='block';
        ghost.style.left=rect.left+'px'; ghost.style.top=rect.top+'px';

        ds={ cards, srcType, srcIdx:idx, offsetX:e.clientX-rect.left, offsetY:e.clientY-rect.top, sourceEl:el };
        el.classList.add('dragging-source');
    });
}

document.addEventListener('mousemove',e=>{
    if(!ds) return;
    const g=document.getElementById('drag-ghost');
    g.style.left=(e.clientX-ds.offsetX)+'px';
    g.style.top=(e.clientY-ds.offsetY)+'px';
});

document.addEventListener('mouseup',e=>{
    if(!ds) return;
    const g=document.getElementById('drag-ghost');
    g.style.display='none';
    ds.sourceEl.classList.remove('dragging-source');

    // Ocultar ghost temporalmente para hit-test
    const tgt=document.elementFromPoint(e.clientX,e.clientY);
    if(tgt){
        const zone=tgt.closest('.zone')||tgt.closest('.pile');
        if(zone){
            const fi=zone.dataset.fi;
            const ti=zone.dataset.ti;
            if(fi!==undefined){
                const fIdx=parseInt(fi);
                if(ds.cards.length===1&&canDropF(ds.cards[0],fIdx)){
                    saveState();
                    removeDragged(ds.srcType,ds.srcIdx,ds.cards);
                    found[fIdx].push(ds.cards[0]);
                    score+=Math.round(10*DIFFICULTIES[diffIndex].mult);
                    moves++; ds=null; render(); return;
                }
            } else if(ti!==undefined){
                const tIdx=parseInt(ti);
                if(canDropT(ds.cards,tIdx)){
                    saveState();
                    removeDragged(ds.srcType,ds.srcIdx,ds.cards);
                    tab[tIdx].push(...ds.cards);
                    score+=3; moves++; ds=null; render(); return;
                }
            }
        }
    }
    ds=null; render();
});

function removeDragged(srcType,srcIdx,cards){
    if(srcType==='waste'){ wasteArr.splice(wasteArr.length-cards.length,cards.length); }
    else if(srcType==='f'){ found[srcIdx].splice(found[srcIdx].length-cards.length,cards.length); }
    else {
        tab[srcIdx].splice(tab[srcIdx].length-cards.length,cards.length);
        const col=tab[srcIdx];
        if(col.length&&!col[col.length-1].face){ col[col.length-1].face=true; score+=5; }
    }
}

/* ============================================================
   VICTORIA
   ============================================================ */
function checkWin(){
    if(!found.every(p=>p.length===13)) return;
    gameOver=true; stopTimer();
    const diff=DIFFICULTIES[diffIndex];
    document.getElementById('win-score').textContent=score;
    document.getElementById('win-moves').textContent=moves;
    document.getElementById('win-diff-name').textContent=diff.name;
    const next=Math.min(diffIndex+1,3);
    let msg='';
    if(next>diffIndex){
        msg='Siguiente partida: '+DIFFICULTIES[next].name+'!';
        diffIndex=next; localStorage.setItem('solitaire-diff',diffIndex);
    } else { msg='Eres un maestro del Solitario Razer!'; }
    document.getElementById('win-next-msg').textContent=msg;
    document.getElementById('win-modal').classList.remove('hidden');
}

/* ============================================================
   SIN MOVIMIENTOS
   ============================================================ */
function checkStuck(){
    if(stockArr.length||wasteArr.length) return;
    for(let ti=0;ti<7;ti++){
        const col=tab[ti]; if(!col.length) continue;
        const top=col[col.length-1]; if(!top.face) continue;
        for(let fi=0;fi<4;fi++) if(canDropF(top,fi)) return;
        for(let tj=0;tj<7;tj++) if(tj!==ti&&canDropT([top],tj)) return;
    }
    document.getElementById('lose-modal').classList.remove('hidden');
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg){
    const t=document.getElementById('toast');
    t.textContent=msg; t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2200);
}

/* ============================================================
   EVENTOS UI
   ============================================================ */
document.getElementById('btn-new').addEventListener('click',startGame);
document.querySelectorAll('#diff-panel .btn-rz').forEach(btn=>{
    btn.addEventListener('click',()=>{
        diffIndex=parseInt(btn.dataset.diff);
        localStorage.setItem('solitaire-diff',diffIndex);
        startGame();
    });
});
document.getElementById('waste-zone').addEventListener('dblclick',()=>{
    if(wasteArr.length) tryAutoFoundation('waste',null);
});

/* ============================================================
   EASTER EGG - ANONYMOUS MATRIX EFFECT
   ============================================================ */
let keysPressed = {};
document.addEventListener('keydown', e => {
    keysPressed[e.key] = true;
    
    // Detectar Ctrl+Alt+A para activar el efecto Matrix
    if(keysPressed['Control'] && keysPressed['Alt'] && e.key === 'a'){
        playMatrixEasterEgg();
    }
});
document.addEventListener('keyup', e => {
    keysPressed[e.key] = false;
});

function playMatrixEasterEgg(){
    const canvas = document.getElementById('easter-egg-canvas');
    const ctx = canvas.getContext('2d');
    
    // Configurar canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    
    // Texto "HACK" 8-bits más claro
    const anonymousMask = [
        'X   X  XXXXX  X X X X X   X  ',
        'X   X  X      X X X X X X  X  ',
        'X X X  X X X  X X X X X X  X  ',
        'XXXXX  X      XXXXX   X XXXXX  ',
        'X   X  X      X X X X X X      ',
        'X   X  X      X X X X X X      ',
        'X   X  XXXXX  X   X X X X   X  '
    ];
    
    // Variables para la lluvia
    const chars = '01ｦｧｨｩｪｫｬｭｮｯﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾆﾈﾉﾊﾋﾌﾍﾌﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾙﾜﾝ█';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    let drops = [];
    
    // Inicializar gotas
    for(let x = 0; x < columns; x++){
        drops[x] = Math.random() * canvas.height;
    }
    
    let frameCount = 0;
    const duration = 4000; // 4 segundos
    const startTime = Date.now();
    
    function drawMatrix(){
        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(5, 15, 5, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar lluvia Matrix
        ctx.fillStyle = '#44d62c';
        ctx.font = fontSize + 'px monospace';
        
        for(let x = 0; x < drops.length; x++){
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(char, x * fontSize, drops[x]);
            
            drops[x] += fontSize;
            
            if(drops[x] > canvas.height){
                drops[x] = Math.random() * canvas.height;
            }
        }
        
        // Dibujar máscara Anonymous centrada
        /*
        const maskWidth = Math.max(...anonymousMask.map(r => r.length)) * 14;
        const maskX = (canvas.width - maskWidth) / 2;
        const maskY = (canvas.height - anonymousMask.length * 18) / 2;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        anonymousMask.forEach((row, i) => {
            let pixelRow = '';
            for(let j = 0; j < row.length; j++){
                pixelRow += (row[j] === 'X' ? '█' : ' ');
            }
            ctx.fillText(pixelRow, maskX, maskY + i * 18);
        });
        */
        
        frameCount++;
        
        // Continuar si no ha pasado el tiempo
        if(Date.now() - startTime < duration){
            requestAnimationFrame(drawMatrix);
        } else {
            canvas.style.display = 'none';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    drawMatrix();
}

// Ajustar canvas al redimensionar ventana
window.addEventListener('resize', () => {
    const canvas = document.getElementById('easter-egg-canvas');
    if(canvas.style.display !== 'none'){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

/* ============================================================
   ARRANCAR
   ============================================================ */
startGame();
