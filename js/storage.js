/* Shared, defensive localStorage layer for the little world. */
(() => {
  'use strict';
  const prefix = 'little-world-';
  const read = (key, fallback) => {
    try { const value = localStorage.getItem(prefix + key); return value ? JSON.parse(value) : fallback; }
    catch (_) { return fallback; }
  };
  const write = (key, value) => { try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch (_) { /* private mode */ } return value; };
  const state = () => read('progress', { hearts: [], achievements: [], completedGames: [], visited: [], daily: null, capsule: null });
  const update = (callback) => { const next = callback(state()) || state(); write('progress', next); return next; };
  const galleryDb = new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error('IndexedDB is unavailable'));
    const request = indexedDB.open('little-world-gallery', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('memories', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const galleryRequest = async (mode, value) => {
    const db = await galleryDb;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('memories', mode === 'list' ? 'readonly' : 'readwrite');
      const store = tx.objectStore('memories'); let request;
      if (mode === 'list') request = store.getAll(); else if (mode === 'put') request = store.put(value); else request = store.delete(value);
      request.onsuccess = () => resolve(mode === 'list' ? request.result : value); request.onerror = () => reject(request.error);
    });
  };
  const api = {
    getProgress: state,
    findHeart(id) { return update((p) => { if (!p.hearts.includes(id)) p.hearts.push(id); return p; }); },
    unlock(id) { let fresh = false; const progress = update((p) => { if (!p.achievements.includes(id)) { p.achievements.push(id); fresh = true; } return p; }); if (fresh) document.dispatchEvent(new CustomEvent('lw:achievement', { detail: { id } })); return progress; },
    finishGame(id) { return update((p) => { if (!p.completedGames.includes(id)) p.completedGames.push(id); return p; }); },
    visit(id) { return update((p) => { if (!p.visited.includes(id)) p.visited.push(id); return p; }); },
    getDaily() { return state().daily; },
    setDaily(value) { return update((p) => { p.daily = value; return p; }); },
    getCapsule() { return state().capsule; },
    setCapsule(value) { return update((p) => { p.capsule = value; return p; }); }
  };
  api.gallery = { list: () => galleryRequest('list').then((items) => items.sort((a,b) => b.date.localeCompare(a.date))), save: (item) => galleryRequest('put', item), remove: (id) => galleryRequest('delete', id) };
  window.LittleWorldStorage = api;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-secret-heart]').forEach((heart) => {
      const id = heart.dataset.secretHeart;
      if (api.getProgress().hearts.includes(id)) heart.remove();
      else heart.addEventListener('click', () => {
        api.findHeart(id); heart.classList.add('is-found');
        setTimeout(() => heart.remove(), 550);
        document.dispatchEvent(new CustomEvent('lw:heart-found', { detail: api.getProgress() }));
      }, { once: true });
    });
  });
})();
