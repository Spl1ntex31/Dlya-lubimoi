(() => {
  'use strict';

  const fallbackSongs = [
    { title: 'Наша первая песня', artist: 'Добавь исполнителя', src: 'assets/music/track-01.mp3', cover: '', note: 'Поставь сюда песню, с которой хочется начать вашу историю.' },
    { title: 'Песня для вечерних прогулок', artist: 'Добавь исполнителя', src: 'assets/music/track-02.mp3', cover: '', note: 'Та самая композиция для долгих разговоров и тёплых дорог рядом.' },
    { title: 'Наше маленькое «навсегда»', artist: 'Добавь исполнителя', src: 'assets/music/track-03.mp3', cover: '', note: 'Пусть она напоминает, что впереди ещё много наших дней.' }
  ];
  
  const savedPlayer = (() => { try { return JSON.parse(sessionStorage.getItem('little-world-player-state') || '{}'); } catch (_) { return {}; } })();
  const state = { songs: fallbackSongs, index: Number(savedPlayer.index) || 0, playing: Boolean(savedPlayer.playing), timer: 0, resumeAt: Number(savedPlayer.time) || 0, resumePlay: Boolean(savedPlayer.playing) };
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = Number(localStorage.getItem('little-world-volume') || .7);
  const $ = (s) => document.querySelector(s);
  const player = $('#lw-player');
  const title = $('[data-lw-title]');
  const artist = $('[data-lw-artist]');
  const note = $('[data-lw-note]');
  const cover = $('[data-lw-cover]');
  const list = $('[data-lw-list]');
  const progress = $('[data-lw-progress]');
  const current = $('[data-lw-current]');
  const duration = $('[data-lw-duration]');
  const playIcon = $('[data-lw-play-icon]');
  const playerButton = $('[data-lw-play]');
  const volume = $('[data-lw-volume]');
  const chip = $('[data-lw-chip]');
  const chipText = $('[data-lw-chip-text]');
  const toast = $('[data-lw-toast]');

  const time = (value) => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '0:00';
  const savePlayer = () => { try { sessionStorage.setItem('little-world-player-state', JSON.stringify({ index: state.index, time: audio.currentTime || 0, playing: state.playing })); } catch (_) {} };
  const announce = (text) => { toast.textContent = text; toast.classList.add('is-visible'); clearTimeout(state.timer); state.timer = setTimeout(() => toast.classList.remove('is-visible'), 3000); };

  function renderList() {
    list.innerHTML = '';
    state.songs.forEach((song, index) => {
      const item = document.createElement('li');
      item.className = `lw-playlist__item${index === state.index ? ' is-active' : ''}`;
      item.innerHTML = `<button type="button"><span>${String(index + 1).padStart(2, '0')}</span><b>${song.title}</b><small>${song.artist}</small><i>${index === state.index && state.playing ? '♫' : '▶'}</i></button>`;
      item.querySelector('button').addEventListener('click', () => { load(index); play(); });
      list.appendChild(item);
    });
  }
  function render() {
    const song = state.songs[state.index];
    title.textContent = song.title; artist.textContent = song.artist; note.textContent = song.note;
    cover.classList.toggle('has-image', Boolean(song.cover));
    cover.style.backgroundImage = song.cover ? `url("${song.cover}")` : '';
    audio.src = song.src; progress.value = 0; current.textContent = '0:00'; duration.textContent = '0:00'; renderList(); savePlayer();
  }
  function sync() {
    playIcon.textContent = state.playing ? 'Ⅱ' : '▶';
    playerButton.setAttribute('aria-label', state.playing ? 'Поставить на паузу' : 'Включить музыку');
    chip.classList.toggle('is-playing', state.playing);
    chipText.textContent = state.playing ? 'музыка играет' : 'включить музыку';
    renderList();
  }
  async function play() {
    try { await audio.play(); state.playing = true; sync(); }
    catch (_) { state.playing = false; sync(); announce('Добавь аудиофайл по пути из data/songs.json, чтобы включить песню.'); }
  }
  function pause() { audio.pause(); state.playing = false; sync(); savePlayer(); }
  function load(index) { state.index = (index + state.songs.length) % state.songs.length; state.resumeAt = 0; state.resumePlay = false; render(); }
  function next() { load(state.index + 1); play(); }
  function previous() { load(state.index - 1); play(); }
  function openPlayer() { player.classList.add('is-open'); player.setAttribute('aria-hidden', 'false'); }
  function closePlayer() { player.classList.remove('is-open'); player.setAttribute('aria-hidden', 'true'); }

  $('[data-lw-play]').addEventListener('click', () => state.playing ? pause() : play());
  $('[data-lw-next]').addEventListener('click', next);
  $('[data-lw-prev]').addEventListener('click', previous);
  document.querySelectorAll('[data-lw-open]').forEach((node) => node.addEventListener('click', openPlayer));
  document.querySelectorAll('[data-lw-close]').forEach((node) => node.addEventListener('click', closePlayer));
  document.querySelectorAll('[data-lw-soon]').forEach((node) => node.addEventListener('click', () => announce('Эта глава появится на следующем этапе. ♡')));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePlayer(); });
  volume.value = Math.round(audio.volume * 100);
  volume.addEventListener('input', () => { audio.volume = Number(volume.value) / 100; localStorage.setItem('little-world-volume', audio.volume); });
  progress.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(progress.value) / 100; });
  audio.addEventListener('loadedmetadata', () => { duration.textContent = time(audio.duration); if (state.resumeAt > 0 && state.resumeAt < audio.duration) { audio.currentTime = state.resumeAt; state.resumeAt = 0; } if (state.resumePlay) { state.resumePlay = false; play(); } });
  audio.addEventListener('timeupdate', () => { if (Number.isFinite(audio.duration)) { progress.value = audio.currentTime / audio.duration * 100; current.textContent = time(audio.currentTime); if (Math.floor(audio.currentTime) % 2 === 0) savePlayer(); } });
  audio.addEventListener('ended', next);
  audio.addEventListener('pause', () => { if (!audio.ended) { state.playing = false; sync(); savePlayer(); } });
  audio.addEventListener('play', () => { state.playing = true; sync(); savePlayer(); });
  window.addEventListener('pagehide', savePlayer);
  (async () => { try { const response = await fetch('data/songs.json', { cache:'no-store' }); if (response.ok) { const songs = await response.json(); if (Array.isArray(songs) && songs.length) state.songs = songs; } } catch (_) { /* file:// может заблокировать fetch — остаётся резервный список */ } state.index = Math.min(state.index, state.songs.length - 1); render(); })();
})();
