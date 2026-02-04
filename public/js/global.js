document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('a[href]:not([data-link])').forEach(link => {

    link.addEventListener('click', e => {
      const url = link.getAttribute('href');

      if (
        url &&
        !url.startsWith('#') &&
        !url.startsWith('http') &&
        !link.hasAttribute('download')
      ) {
        document.body.classList.add('page-leave');
      }
    });

  });

  const toggleBtn = document.getElementById('sidebarToggle');
  const appLayout = document.querySelector('.app-layout');

  if (toggleBtn && appLayout) {
    toggleBtn.addEventListener('click', () => {
      appLayout.classList.toggle('sidebar-collapsed');

      toggleBtn.textContent =
        appLayout.classList.contains('sidebar-collapsed') ? '❯' : '❮';
    });
  }

});
