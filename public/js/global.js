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

  const sidebarSections = document.querySelectorAll('.sidebar-section');
  if (sidebarSections.length) {
    const lastSection = sidebarSections[sidebarSections.length - 1];
    lastSection.appendChild(toggleBtn);
  }
}

});

function initScrollToTop() {
  const scrollToTopBtn = document.getElementById("scrollToTop");
  if (!scrollToTopBtn) return;

  if (!scrollToTopBtn.dataset.listener) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        scrollToTopBtn.classList.add("visible");
      } else {
        scrollToTopBtn.classList.remove("visible");
      }
    });

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    scrollToTopBtn.dataset.listener = "true";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollToTop();
});

window.addEventListener("page:loaded", () => {
  initScrollToTop();
});
