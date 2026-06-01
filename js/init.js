(function() {
  const overlay = document.getElementById('s1-reid-overlay');

  function makePopup(triggerId, popupId, closeId) {
    const trigger  = document.getElementById(triggerId);
    const popup    = document.getElementById(popupId);
    const closeBtn = document.getElementById(closeId);
    if (!trigger || !popup) return;
    function open()  { popup.classList.add('open');  overlay.classList.add('open');  }
    function close() { popup.classList.remove('open'); overlay.classList.remove('open'); }
    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  makePopup('s1-reid-trigger', 's1-reid-popup', 's1-reid-close');
  makePopup('s1-gr-trigger',   's1-gr-popup',   's1-gr-close');

  // Popup S5 — usano il proprio overlay
  const s5overlay = document.getElementById('s5-popup-overlay');
  function makeS5Popup(triggerId, popupId, closeId) {
    const trigger  = document.getElementById(triggerId);
    const popup    = document.getElementById(popupId);
    const closeBtn = document.getElementById(closeId);
    if (!trigger || !popup || !s5overlay) return;
    function open()  { popup.classList.add('open');  s5overlay.classList.add('open');  }
    function close() { popup.classList.remove('open'); s5overlay.classList.remove('open'); }
    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    s5overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  makeS5Popup('s5-pga-trigger', 's5-pga-popup', 's5-pga-close');
  makeS5Popup('s5-dpc-trigger', 's5-dpc-popup', 's5-dpc-close');
})();