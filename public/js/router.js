const app = document.getElementById("app");
if (!app) throw new Error("#app container fehlt");

async function loadPage(path) {

  let file = "";

  if (path === "/" || path === "") {
    file = "/pages/home.html";
  }

  if (path === "/standorte") {
    file = "/pages/standorte.html";
  }

  if (!file) return;

  const res = await fetch(file);
  const html = await res.text();

  app.innerHTML = html;

  document.dispatchEvent(new Event("page:loaded"));

  setActiveSidebar(path);

  if (window.lucide) lucide.createIcons();

  const pageName = path.replace("/", "") || "home";
  const initFn = window["init" + capitalize(pageName) + "UI"];

  if (typeof initFn === "function") {
    initFn();
  }
}

function setActiveSidebar(path) {
  document.querySelectorAll("[data-link]").forEach(link => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === path);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.addEventListener("click", e => {
  const link = e.target.closest("[data-link]");
  if (!link) return;

  e.preventDefault();

  const path = link.getAttribute("href");
  history.pushState({}, "", path);

  loadPage(path);
});

window.addEventListener("popstate", () => {
  loadPage(location.pathname);
});

loadPage(location.pathname);
