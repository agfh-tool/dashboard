window.initHomeUI = function() {
  console.log("Home UI initialized");

  // Beispiel-Inhalte für die Kacheln
  const neu = [
    "Neue Benutzeroberfläche geplant",
    "Verbesserung der Datenvisualisierung",
    "Mobile Ansicht optimiert"
  ];

  const planung = [
    "Integration von Push-Benachrichtigungen",
    "Erweiterte Suchfunktionen",
    "Export-Funktion für Reports"
  ];

  const tipps = [
    "Tipp: Nutze die Suche, um schnell Bundesländer zu finden.",
    "Tipp: Halte deine Notizen aktuell."
  ];

  const infos = [
    "Dashboard Version 1.2.0",
    "Letztes Update: 01.02.2026",
    "Feedback jederzeit willkommen"
  ];

  function renderList(id, items) {
    const container = document.getElementById(id);
    container.innerHTML = items.map(i => `<li>${i}</li>`).join('');
  }

  renderList('kachelNeu', neu);
  renderList('kachelPlanung', planung);
  renderList('kachelTipp', tipps);
  renderList('kachelInfo', infos);

  // Lucide Icons initialisieren
  lucide.createIcons();
};
