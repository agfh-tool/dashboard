window.initHomeUI = function() {
  console.log("Home UI initialized");

  function renderList(id, items) {
    const container = document.getElementById(id);
    container.innerHTML = items.map(i => `<li>${i}</li>`).join('');
  }

  renderList('kachelNeu', neu);
  renderList('kachelPlanung', planung);
  renderList('kachelTipp', tipps);
  renderList('kachelInfo', infos);

  lucide.createIcons();
};
