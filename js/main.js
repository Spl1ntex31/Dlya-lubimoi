(() => {
  'use strict';
  const root = document.documentElement;
  const page = document.body.dataset.page || (location.pathname.includes('memories') ? 'memories' : location.pathname.includes('letters') ? 'letters' : location.pathname.includes('our-world') ? 'world' : location.pathname.includes('for-you') ? 'for-you' : 'home');
  const isHome = page === 'home', base = isHome ? '' : '../';
  const storage = () => window.LittleWorldStorage;
  const links = [{ id:'home', label:'Главная', href:`${base}index.html` },{ id:'letters', label:'Письма', href:`${base}pages/letters.html` },{ id:'memories', label:'Воспоминания', href:`${base}pages/memories.html` },{ id:'world', label:'Наш мир', href:`${base}pages/our-world.html` },{ id:'for-you', label:'For You', href:`${base}pages/for-you.html` }];
  function addNavigation() {
    const header = document.querySelector('.lw-header'); if (!header || header.querySelector('.lw-site-nav')) return;
    const nav = document.createElement('nav'); nav.className = 'lw-site-nav'; nav.setAttribute('aria-label','Все главы');
    nav.innerHTML = links.map((item) => `<a class="${item.id === page ? 'is-current' : ''}" href="${item.href}">${item.label}</a>`).join('');
    header.appendChild(nav);
  }
  function addLaunchNotice() { if (location.protocol !== 'file:') return; const notice = document.createElement('p'); notice.className = 'lw-launch-notice'; notice.textContent = 'Чтобы увидеть изменённые тексты, музыку и фотографии, запускай сайт через start-site.command, а не двойным кликом по HTML.'; document.body.prepend(notice); }
  function addPlayer() {
    if (document.querySelector('#lw-player') || document.querySelector('.lw-mini-player')) return;
    const node = document.createElement('aside'); node.className = 'lw-mini-player'; node.innerHTML = '<button type="button" data-mini-play aria-label="Включить музыку">♫</button><span data-mini-title>наша музыка</span><button type="button" data-mini-next aria-label="Следующая песня">→</button><audio data-mini-audio preload="metadata"></audio>';
    document.body.appendChild(node);
    const audio = node.querySelector('[data-mini-audio]'), title = node.querySelector('[data-mini-title]'), play = node.querySelector('[data-mini-play]');
    const saved = (() => { try { return JSON.parse(sessionStorage.getItem('little-world-player-state') || '{}'); } catch (_) { return {}; } })();
    const fallback = [{title:'Наша музыка',artist:'для нас',src:''}], dataUrl = `${base}data/songs.json`; let songs = fallback, index = Number(saved.index) || 0, resumeAt = Number(saved.time) || 0, wantedPlay = Boolean(saved.playing);
    const save = () => { try { sessionStorage.setItem('little-world-player-state', JSON.stringify({ index, time: audio.currentTime || 0, playing: !audio.paused })); } catch (_) {} };
    const render = () => { const song = songs[index]; title.textContent = `${song.title} · ${song.artist}`; audio.src = song.src ? `${base}${song.src}` : ''; };
    fetch(dataUrl, { cache:'no-store' }).then((r) => r.ok ? r.json() : fallback).then((data) => { if (Array.isArray(data) && data.length) songs = data; index = Math.min(index, songs.length - 1); render(); }).catch(() => render());
    play.addEventListener('click', () => { if (!audio.src) return; if (audio.paused) audio.play().then(() => { play.textContent = 'Ⅱ'; play.setAttribute('aria-label','Поставить на паузу'); }).catch(() => {}); else { audio.pause(); play.textContent = '♫'; play.setAttribute('aria-label','Включить музыку'); } });
    node.querySelector('[data-mini-next]').addEventListener('click', () => { index = (index + 1) % songs.length; resumeAt = 0; render(); audio.play().then(() => { play.textContent = 'Ⅱ'; }).catch(() => {}); });
    audio.addEventListener('ended', () => node.querySelector('[data-mini-next]').click());
    audio.addEventListener('loadedmetadata', () => { if (resumeAt > 0 && resumeAt < audio.duration) { audio.currentTime = resumeAt; resumeAt = 0; } if (wantedPlay) audio.play().then(() => { play.textContent = 'Ⅱ'; }).catch(() => { wantedPlay = false; }); });
    audio.addEventListener('timeupdate', () => { if (Math.floor(audio.currentTime) % 2 === 0) save(); }); audio.addEventListener('pause', save); window.addEventListener('pagehide', save);
  }
  function finalGift() {
    const button = document.querySelector('[data-open-gift]'); if (!button) return;
    const stage = document.querySelector('[data-gift-stage]'), letter = document.querySelector('[data-final-letter]'), text = document.querySelector('[data-final-text]'), cta = document.querySelector('[data-final-cta]');
    const message = 'Если ты читаешь это, значит, ты дошла до самой последней страницы нашего маленького мира. И я хочу, чтобы среди всех фотографий, песен и записок ты услышала одну простую вещь: ты очень важна для меня.\n\nСпасибо тебе за дни, которые стали теплее просто потому, что в них появилась ты. За разговоры, после которых не хочется прощаться. За улыбки, которые я запоминаю без всякой камеры. За твоё настоящее, живое, прекрасное «ты».\n\nЯ не знаю, сколько ещё историй ждёт нас впереди. Но я знаю, что хочу встречать их рядом с тобой  бережно, честно и с тем же трепетом, с которым сделал для тебя этот мир.\n\nТы не финал этой истории. Ты её самое красивое продолжение.';
    function reveal() { let i = 0; text.textContent = ''; const tick = () => { text.textContent += message[i++] || ''; if (i <= message.length) setTimeout(tick, 12); else cta.hidden = false; }; tick(); }
    const openGift = () => { if (stage.classList.contains('is-open')) return; stage.classList.add('is-open'); button.setAttribute('aria-expanded','true'); document.querySelector('[data-gift-hint]').textContent = 'Пусть этот момент останется с тобой.'; const particles = document.querySelector('[data-gift-particles]'); particles.innerHTML = Array.from({length:28},(_,i) => `<i style="--x:${(Math.random()*2-1)*210}px;--y:${-35-Math.random()*210}px;--r:${Math.random()*360}deg;animation-delay:${i*18}ms">${i%3 ? '♥' : '✦'}</i>`).join(''); letter.hidden = false; requestAnimationFrame(() => letter.classList.add('is-visible')); setTimeout(reveal, 620); storage().unlock('final-letter'); };
    button.addEventListener('click', openGift);
    const visited = storage().getProgress().visited || [];
    if (['letters','memories','world'].every((id) => visited.includes(id))) { document.querySelector('[data-gift-hint]').textContent = 'Ты прошла все главы — подарок откроется сам.'; setTimeout(openGift, 650); }
  }
  function addAchievementToast() { const labels = { memory:'Memory Collector', finder:'Heart Finder', explorer:'Our Story Explorer', 'final-letter':'Final letter' }; const toast = document.createElement('div'); toast.className = 'lw-achievement-toast'; toast.setAttribute('role','status'); document.body.appendChild(toast); document.addEventListener('lw:achievement', (event) => { toast.innerHTML = `<span>✦</span><div><small>Новое достижение</small><strong>${labels[event.detail.id] || 'Новый секрет'}</strong></div>`; toast.classList.add('is-visible'); setTimeout(() => toast.classList.remove('is-visible'), 4200); }); }
  document.addEventListener('DOMContentLoaded', () => { storage().visit(page); addNavigation(); addPlayer(); finalGift(); addAchievementToast(); addLaunchNotice(); root.classList.add('lw-main-ready'); });
})();
