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
})();