import { base } from '$app/paths';
export const sampleNames = ['baseline-360-aac441.mp4','baseline-480-aac480.mp4','main-720-aac480.mp4','baseline-360-silent.mp4'];
export function safeMediaUrl(value: string): string {
  if (!value) return '';
  try { const u=new URL(value,location.href); return u.origin+u.pathname+(u.search?'?[redacted]':''); } catch { return '[invalid]'; }
}
export function snapshotMedia(media: HTMLVideoElement) {
  const types=['video/mp4','video/mp4; codecs="avc1.42C01E, mp4a.40.2"','video/mp4; codecs="avc1.4D401F, mp4a.40.2"','audio/mp4; codecs="mp4a.40.2"'];
  const canPlayType:Record<string,string>={}; types.forEach(type=>canPlayType[type]=media.canPlayType(type));
  function ranges(r:TimeRanges) { return Array.from({length:r.length},(_,i)=>[r.start(i),r.end(i)]); }
  return {version:'Materialious VIDAA 0.1',error:media.error?{code:media.error.code,message:String(media.error.message||'(not provided)').replace(/https?:\/\/[^\s"<>]+/g,safeMediaUrl)}:null,currentSrc:safeMediaUrl(media.currentSrc),readyState:media.readyState,networkState:media.networkState,currentTime:media.currentTime,duration:isFinite(media.duration)?media.duration:null,paused:media.paused,muted:media.muted,volume:media.volume,width:media.videoWidth,height:media.videoHeight,buffered:ranges(media.buffered),seekable:ranges(media.seekable),canPlayType,mse:typeof MediaSource!=='undefined',ua:navigator.userAgent};
}
export function samplePath(name:string) { if(!sampleNames.includes(name)) throw new Error('Unknown sample'); return `${base}/vidaa-media/${name}`; }
