// smooth page

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', e => {
      const url = link.getAttribute('href');

      // intern
      if (
        url &&
        !url.startsWith('#') &&
        !url.startsWith('http') &&
        !link.hasAttribute('download')
      ) {
        e.preventDefault();

        document.body.classList.add('page-leave');

        setTimeout(() => {
          window.location.href = url;
        }, 200);
      }
    });
  });
});
