(function () {
  const menuBtn = document.querySelector('[data-open-menu]');
  const sidebar = document.querySelector('.sidebar');
  const scrim = document.querySelector('.scrim');
  const profileBtn = document.querySelector('[data-profile]');
  const notesBtn = document.querySelector('[data-notes]');
  const profileMenu = document.querySelector('[data-profile-menu]');
  const notesMenu = document.querySelector('[data-notes-menu]');

  function closePopovers() {
    profileMenu?.classList.remove('open');
    notesMenu?.classList.remove('open');
  }

  menuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    scrim?.classList.toggle('show');
  });
  scrim?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    scrim?.classList.remove('show');
  });
  profileBtn?.addEventListener('click', () => {
    notesMenu?.classList.remove('open');
    profileMenu?.classList.toggle('open');
  });
  notesBtn?.addEventListener('click', () => {
    profileMenu?.classList.remove('open');
    notesMenu?.classList.toggle('open');
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.popover-anchor')) closePopovers();
  });

  if (window.lucide) window.lucide.createIcons();

  const list = document.querySelector('[data-notes-list]');
  if (list && window.AgroService) {
    const pending = AgroService.getState().activities.filter((item) => !item.done);
    list.innerHTML = pending.length
      ? pending.map((item) => '<p>' + item.title + '</p>').join('')
      : '<p>Todo al día.</p>';
  }
})();
