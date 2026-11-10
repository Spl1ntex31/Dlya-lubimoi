(() => {
  'use strict';
  const fallback = [
    {id:'miss-me',title:'Открой, когда скучаешь по мне',subtitle:'для тех дней, когда хочется быть ближе',accent:'розовый',body:'Если ты открыла это письмо, значит, между нами сейчас есть расстояние. Но оно не сильнее того, что я чувствую к тебе. Представь, что я рядом: обнимаю тебя, спрашиваю, как прошёл день, и никуда не тороплюсь.'},
    {id:'sad',title:'Открой, когда тебе грустно',subtitle:'мягкое напоминание о твоей силе',accent:'лавандовый',body:'Пожалуйста, не забывай: тебе не нужно быть сильной каждую минуту. Можно устать, погрустить, ничего не успевать. Ты не становишься от этого менее прекрасной. Я рядом — не только в хороших днях, а во всех твоих состояниях.'},
    {id:'smile',title:'Открой, когда нужна улыбка',subtitle:'немного тепла в одном конверте',accent:'персиковый',body:'Улыбнись хотя бы чуть-чуть. Не потому что всё обязано быть идеально, а потому что твоя улыбка — одна из моих самых любимых вещей в этом мире. Вспомни наш самый смешной момент, а потом придумай новый.'},
    {id:'remember-us',title:'Открой, когда хочешь вспомнить нас',subtitle:'всё настоящее уже случилось с нами',accent:'голубой',body:'Мы уже прожили столько маленьких историй, которые стали большими. Прогулки без маршрута, разговоры до позднего вечера, смешные фразы, понятные только нам. Это наш общий дом, который мы продолжаем строить.'},
    {id:'last-letter',title:'Последнее письмо',subtitle:'оно откроется, когда будут прочитаны остальные',accent:'золотой',locked:true,body:'Ты открыла все письма, а значит, дошла сюда. Я хочу, чтобы ты знала главное: выбирая тебя, я каждый раз выбираю самое тёплое, честное и важное. Пусть впереди будет ещё много глав, которые мы напишем вместе.'}
  ];
  const $ = (s) => document.querySelector(s); const envelopes = $('[data-envelopes]'), progress = $('[data-letter-progress]'), modal = $('[data-letter-modal]'), title = $('[data-letter-title]'), body = $('[data-letter-body]');
  const storageKey = 'little-world-opened-letters'; let letters = fallback, opened = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')), typingTimer;
  function isUnlocked(letter) { return !letter.locked || letters.filter((item) => !item.locked).every((item) => opened.has(item.id)); }
  function save() { localStorage.setItem(storageKey, JSON.stringify([...opened])); }
  function render() {
    const required = letters.filter((letter) => !letter.locked);
    progress.textContent = `Прочитано писем: ${required.filter((letter) => opened.has(letter.id)).length} из ${required.length}`;
    envelopes.innerHTML = letters.map((letter, index) => {
      const locked = !isUnlocked(letter), wasOpened = opened.has(letter.id);
      return `<article class="lw-envelope ${locked ? 'is-locked' : ''} ${wasOpened ? 'was-opened' : ''}" style="--envelope-index:${index}"><button type="button" data-letter="${letter.id}" ${locked ? 'disabled' : ''}><span class="lw-envelope__seal">${locked ? '🔒' : '♡'}</span><span class="lw-envelope__paper"><b>${letter.title}</b><small>${locked ? 'сначала открой остальные письма' : letter.subtitle}</small></span></button></article>`;
    }).join('');
    envelopes.querySelectorAll('[data-letter]').forEach((button) => {
      button.addEventListener('click', () => {
        openLetter(letters.find((letter) => letter.id === button.dataset.letter), button.closest('.lw-envelope'));
      });
    });
  }
  function typeText(text) { clearTimeout(typingTimer); body.textContent = ''; let index = 0; const tick = () => { body.textContent += text[index++] || ''; if (index <= text.length) typingTimer = setTimeout(tick, 14); }; tick(); }
  function openLetter(letter, envelope) { if (!letter || !isUnlocked(letter)) return; envelope.classList.add('is-opening'); opened.add(letter.id); save(); title.textContent = letter.title; body.textContent = ''; modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); setTimeout(() => typeText(letter.body), 350); render(); }
  function close() { clearTimeout(typingTimer); modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); }
  document.querySelectorAll('[data-close-letter]').forEach((button) => button.addEventListener('click', close)); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  (async () => { try { const response = await fetch('../data/letters.json', { cache:'no-store' }); if (response.ok) { const data = await response.json(); if (Array.isArray(data) && data.length) letters = data; } } catch (_) { /* file:// использует запасные данные */ } render(); })();
})();
