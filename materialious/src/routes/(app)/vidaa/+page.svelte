<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import shaka from 'shaka-player/dist/shaka-player.ui';
  import { snapshotMedia, samplePath, sampleNames } from '$lib/vidaa/media';
  let video:HTMLVideoElement;
  let engine=$state('native');
  let status=$state('Выберите контрольный файл. Это диагностика, не YouTube.');
  let selected=$state(0);
  let player:shaka.Player|null=null;
  let serial=0;
  let report=$state('');
  let httpReport=$state('');
  let events=$state<string[]>([]);
  let lastError:unknown=$state(null);
  let shakaError:unknown=$state(null);
  const labels=['A · Baseline 360p + AAC 44.1 mono','B · Baseline 480p + AAC 48 stereo','C · Main 720p + AAC 48 stereo','D · Baseline 360p, без звука'];
  function update(event='manual') { if(!video)return; const current=snapshotMedia(video); if(current.error)lastError=current; report=JSON.stringify({engine,selected:selected<0?'E · DASH 360p / 720p':labels[selected],event,...current,lastError,shakaError,shakaSupported:shaka.Player.isBrowserSupported(),events:events.slice(-14)},null,2); }
  async function play() { try { await video.play(); } catch(error) { status='play() отклонён: '+String(error); update('play-rejected'); } }
  async function start(index:number) {
    if(index<0)engine='shaka';
    const source=index<0?`${base}/vidaa-media/dash/control.mpd`:samplePath(sampleNames[index]);
    const ticket=++serial; selected=index; lastError=null; shakaError=null; events=[]; status='Загружается '+(index<0?'E · DASH 360p / 720p':labels[index]);
    video.pause();
    if(player) { const old=player; player=null; await old.destroy(); }
    if(ticket!==serial)return;
    video.removeAttribute('src'); video.load();
    try {
      if(engine==='shaka') {
        const next=new shaka.Player(); player=next;
        next.addEventListener('error',(event)=> { const detail=(event as CustomEvent).detail; shakaError={code:detail?.code,category:detail?.category,severity:detail?.severity}; update('shaka-error'); });
        await next.attach(video); if(ticket!==serial)return;
        await next.load(source,0,index<0?'application/dash+xml':'video/mp4');
      } else { video.src=source; video.load(); }
      if(ticket!==serial)return;
      await play(); update('start');
    } catch(error) { shakaError=String(error); status='Ошибка загрузки: '+String(error); update('load-error'); }
  }
  function seek(delta:number) { if(isFinite(video.duration))video.currentTime=Math.max(0,Math.min(video.duration-.1,video.currentTime+delta)); }
  async function checkHTTP() {
    const output:unknown[]=[];
    for(const method of ['HEAD','GET']) {
      try { const response=await fetch(selected<0?`${base}/vidaa-media/dash/control.mpd`:samplePath(sampleNames[selected]),{method,headers:method==='GET'?{Range:'bytes=0-255'}:{},cache:'no-store'}); output.push({method,status:response.status,type:response.headers.get('content-type'),length:response.headers.get('content-length'),range:response.headers.get('content-range'),acceptRanges:response.headers.get('accept-ranges')}); if(response.body)await response.body.cancel(); }
      catch(error){output.push({method,error:String(error)});}
    }
    httpReport=JSON.stringify(output,null,2);
  }
  onMount(()=> {
    shaka.polyfill.installAll();
    const names=['loadstart','loadedmetadata','loadeddata','canplay','playing','pause','seeking','seeked','stalled','waiting','ended','error'];
    const handlers=names.map(name=> { const callback=()=>{ events=[...events,`${name} t=${video.currentTime.toFixed(2)} ready=${video.readyState} net=${video.networkState}`].slice(-30); if(name==='error')status='MediaError '+video.error?.code+': '+(video.error?.message||'(message отсутствует)'); update(name); }; video.addEventListener(name,callback); return {name,callback}; });
    const timer=setInterval(()=>update('tick'),1000); update('ready');
    return ()=>{serial++; clearInterval(timer); handlers.forEach(({name,callback})=>video.removeEventListener(name,callback)); if(player)void player.destroy();};
  });
</script>
<svelte:head><title>VIDAA — диагностика Materialious</title></svelte:head>
<section class="vidaa-diagnostic">
  <h2>Materialious · VIDAA 9 · проверка MP4</h2><p>Целевой браузер: Chrome 111 / VIDAA-MT9602. Проверки на ПК не доказывают совместимость телевизора.</p>
  <div class="vidaa-samples">{#each labels as label,index (label)}<button data-sample={index} onclick={()=>start(index)}>{label}</button>{/each}<button data-dash onclick={()=>start(-1)}>E · DASH 360p / 720p (Shaka)</button></div>
  <p>Все файлы: 24 с, H.264 avc1, yuv420p, MP4 faststart. A/B: Baseline Level 3.0; C: Main Level 3.1. A/B/C: AAC-LC, тихий тон 440 Гц. D намеренно без аудио.</p>
  <button id="engine-toggle" onclick={()=>{engine=engine==='native'?'shaka':'native';status='Движок изменён; выберите файл повторно';}}>Движок: {engine==='native'?'HTML5 native':'Materialious / Shaka'}</button>
  <button onclick={checkHTTP}>HTTP / Range</button><button onclick={()=>update()}>Отчёт</button>
  <p role="status" id="vidaa-status">{status}</p>
  <video id="vidaa-test-video" bind:this={video} controls playsinline preload="metadata"></video>
  <div><button id="vidaa-play" onclick={play}>Играть</button><button id="vidaa-pause" onclick={()=>video.pause()}>Пауза</button><button id="vidaa-back10" onclick={()=>seek(-10)}>−10 с</button><button id="vidaa-forward10" onclick={()=>seek(10)}>+10 с</button></div>
  <h4>MediaError, состояние и кодеки</h4><pre id="vidaa-media-report" tabindex="0">{report}</pre>
  <h4>HTTP</h4><pre id="vidaa-http-report" tabindex="0">{httpReport}</pre>
  <p class="vidaa-legal">Основано на <a href="https://github.com/Materialious/Materialious" target="_blank" rel="noreferrer">Materialious</a> · AGPL-3.0. Авторы и благодарности сохранены в исходниках. Изменения VIDAA: интерфейс, пульт, диагностика. <a href={`${base}/source.zip`} download>Соответствующий исходный код</a> · <a href={`${base}/LICENSE.txt`}>Лицензия</a>. Не связано с Google/Hisense. Отчёт остаётся на экране, автоматически никуда не отправляется.</p>
</section>
<style>.vidaa-samples{display:flex;flex-wrap:wrap;gap:12px}video{display:block;background:#000;width:100%;max-height:48vh}pre{white-space:pre-wrap;overflow-wrap:anywhere}button{margin:8px}</style>

