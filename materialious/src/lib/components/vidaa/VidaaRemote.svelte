<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { getNextFocus } from '@bbc/tv-lrud-spatial';
  import { isVidaaUI } from '$lib/vidaa/platform';
  import { afterNavigate } from '$app/navigation';
  let editing = $state(false);
  let value = $state('');
  let input: HTMLInputElement | HTMLTextAreaElement | null = null;
  let panel: HTMLElement;
  let alphabet = $state('ru');
  const letters = $derived((alphabet === 'ru' ? 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя' : 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') + '0123456789-_.:/?=&%');
  function visible(el: HTMLElement) { return !!el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'; }
  function focus(el: HTMLElement | null) { if (el) { el.focus(); el.scrollIntoView({ block:'nearest', inline:'nearest' }); } }
  function initialFocus() {
    if (!isVidaaUI() || editing) return;
    const active = document.activeElement as HTMLElement;
    if (active && active !== document.body && visible(active)) return;
    focus(document.querySelector<HTMLElement>('.player-settings.active li') || document.querySelector<HTMLElement>('main input, main button, main .item-select, #left-nav a'));
  }
  afterNavigate(() => { if (isVidaaUI()) void tick().then(initialFocus); });
  async function openInput(target: HTMLInputElement | HTMLTextAreaElement) {
    input = target; value = target.value; editing = true;
    await tick(); focus(panel.querySelector('button'));
  }
  function close(apply = false) {
    editing = false;
    if (input && apply) { input.value = value; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); }
    void tick().then(() => focus(input));
  }
  function move(code: number, scope: HTMLElement) {
    const active = document.activeElement;
    const next = active ? getNextFocus(active, code, scope) : null;
    if (next instanceof HTMLElement && visible(next)) focus(next);
  }
  onMount(() => {
    if (!isVidaaUI()) return;
    document.documentElement.classList.add('vidaa-tv');
    const keyNames: Record<number,string> = {37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',13:'Enter',461:'Escape',10009:'Escape',8:'Escape',415:'MediaPlay',19:'MediaPause',413:'MediaStop',417:'MediaFastForward',412:'MediaRewind',179:'MediaPlayPause'};
    let consumedEscape = false;
    function capture(event: KeyboardEvent) {
      if(event.type==='keyup' && event.key==='Escape' && consumedEscape) { consumedEscape=false; event.preventDefault(); event.stopImmediatePropagation(); return; }
      const code=event.keyCode;
      const mapped=keyNames[code];
      if (mapped && event.key !== mapped && !event.altKey && !event.ctrlKey) {
        event.preventDefault(); event.stopImmediatePropagation();
        const normalized = new KeyboardEvent(event.type,{key:mapped,code:mapped,keyCode: mapped==='Escape'?27:code,which:mapped==='Escape'?27:code,bubbles:true,cancelable:true,repeat:event.repeat});
        (event.target || document).dispatchEvent(normalized); return;
      }
      const menu = document.querySelector<HTMLElement>('.player-settings.active');
      if (editing || menu) {
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape'].includes(event.key)) {
          event.preventDefault(); event.stopImmediatePropagation();
          if (event.type!=='keydown') return;
          if (event.key==='Escape') { consumedEscape=true; if (editing) close(); else (menu?.previousElementSibling as HTMLElement)?.click(); }
          else if (event.key==='Enter') (document.activeElement as HTMLElement)?.click();
          else move(event.keyCode,editing?panel:menu!);
        }
      }
    }
    function fallback(event: KeyboardEvent) {
      if (event.defaultPrevented || editing || event.type!=='keydown') return;
      const active=document.activeElement as HTMLElement;
      const inputLike = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if (event.key==='Enter' && inputLike && !active.readOnly && !active.disabled) { event.preventDefault(); void openInput(active); return; }
      const media=document.querySelector('video');
      if (media && event.key.startsWith('Media')) {
        event.preventDefault();
        if (event.key==='MediaStop') media.pause();
        else if (event.key==='MediaPause') media.pause();
        else if (event.key==='MediaFastForward' || event.key==='MediaRewind') media.currentTime=Math.max(0,Math.min(isFinite(media.duration)?media.duration:Infinity,media.currentTime+(event.key==='MediaFastForward'?10:-10)));
        else if (event.key==='MediaPlay' || media.paused) void media.play().catch(()=>{}); else media.pause();
        return;
      }
      if (/\/tv\//.test(location.pathname) && !document.getElementById('shown-info')) return;
      const dialog=document.querySelector<HTMLElement>('dialog[open], dialog.active');
      if (event.key==='Escape') {
        event.preventDefault();
        if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
        else if (dialog) (dialog.querySelector('[data-ui], button') as HTMLElement)?.click();
        else if (document.fullscreenElement) void document.exitFullscreen();
        else if (history.length>1) history.back();
        else focus(document.querySelector('#left-nav a'));
        return;
      }
      if(active?.tagName==='PRE' && ['ArrowDown','ArrowUp'].includes(event.key)) {
        const delta=event.key==='ArrowDown'?160:-160;
        if((delta>0 && active.scrollTop+active.clientHeight<active.scrollHeight-2)||(delta<0 && active.scrollTop>0)) { event.preventDefault();active.scrollTop+=delta;return; }
      }
      if (/^Arrow/.test(event.key)) { event.preventDefault(); move(event.keyCode,dialog || document.body); }
      else if (event.key==='Enter' && active && !['BUTTON','A','INPUT','TEXTAREA','SUMMARY','SELECT'].includes(active.tagName)) { event.preventDefault(); active.click(); }
    }
    function backFromPlayer(event:KeyboardEvent) {
      if (event.key==='Escape' && event.type==='keyup' && !event.defaultPrevented && /\/tv\//.test(location.pathname) && !document.getElementById('shown-info')) { event.preventDefault(); history.back(); }
    }
    document.addEventListener('keydown',capture,true); document.addEventListener('keyup',capture,true);
    window.addEventListener('keydown',fallback); window.addEventListener('keyup',backFromPlayer);
    const observer=new MutationObserver(()=> { void tick().then(initialFocus); }); observer.observe(document.body,{childList:true,subtree:true});
    initialFocus();
    return ()=> { observer.disconnect(); document.removeEventListener('keydown',capture,true); document.removeEventListener('keyup',capture,true); window.removeEventListener('keydown',fallback); window.removeEventListener('keyup',backFromPlayer); document.documentElement.classList.remove('vidaa-tv'); };
  });
</script>
{#if editing}
  <section id="vidaa-keyboard" role="dialog" aria-modal="true" aria-label="Экранная клавиатура" bind:this={panel}>
    <h4>Ввод текста</h4><p class="vidaa-entry">{input?.type==='password'?'•'.repeat(value.length):value}▏</p>
    <div class="vidaa-key-grid">
      {#each letters.split('') as char,index (index)}<button onclick={()=>value+=char}>{char}</button>{/each}
      <button onclick={()=>alphabet=alphabet==='ru'?'en':'ru'}>RU / EN</button><button onclick={()=>value+=' '}>Пробел</button>
      <button onclick={()=>value=value.slice(0,-1)}>⌫</button><button onclick={()=>value=''}>Очистить</button>
      <button onclick={()=>close(true)}>Готово</button><button onclick={()=>close()}>Отмена</button>
    </div>
  </section>
{/if}
