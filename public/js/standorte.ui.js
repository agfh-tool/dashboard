window.initStandorteUI = function () {

  try {

    console.log("INIT START");
let editId = null;
const nameInput = document.getElementById('name');
const typSelect = document.getElementById('typ');
const pfkCheckbox = document.getElementById('pfk');
const anerkennungCheckbox = document.getElementById('anerkennung');
const statusSelect = document.getElementById('status');
const notizInput = document.getElementById('notiz');
const bundeslandTable = document.getElementById('bundeslandTable');
const modal = document.getElementById('modal');
const bundeslandSelect = document.getElementById('bundesland');
const formError = document.getElementById('formError');

let bundeslandMeta = {};

const META_LABELS = {
  abrechnung: 'Abrechnungsmöglichkeiten',
  anerkannt_fuer: 'Anerkannt für',
  anerkennung: 'Anerkennung',
  kontakt: 'Kontakt',
  verordnung: 'Verordnung',
  notiz: 'Notiz'
};

const TABELLEN_BUNDESLAENDER = [
  'Baden-Württemberg',
  'Brandenburg',
  'Rheinland-Pfalz',
  'Thüringen'
];

const BUNDESLAND_STATUS = {
  'Baden-Württemberg': false,
  'Bayern': true,
  'Berlin': true,
  'Brandenburg': false,
  'Bremen': true,
  'Hamburg': true,
  'Hessen': true,
  'Mecklenburg-Vorpommern': true,
  'Niedersachsen': true,
  'Nordrhein-Westfalen': true,
  'Rheinland-Pfalz': false,
  'Saarland': true,
  'Sachsen': true,
  'Sachsen-Anhalt': true,
  'Schleswig-Holstein': true,
  'Thüringen': false
};

let grouped = {};
let searchTerm = '';

function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove('hidden');
}

function clearError() {
  formError.textContent = '';
  formError.classList.add('hidden');
}

const addBtn = document.getElementById('addBtn');
if (addBtn) addBtn.onclick = openModal;

load();

function load() {
  fetch('/api/standorte/bundeslaender/meta')
    .then(r => {
      if (!r.ok) return {};
      return r.json();
    })
    .catch(() => ({}))
    .then(meta => {
      bundeslandMeta = meta || {};
      return fetch('/api/standorte');
    })
    .then(r => r.json())
    .then(data => {

      bundeslandTable.innerHTML = '';

      const ALL_BUNDESLAENDER = [
        'Baden-Württemberg',
        'Bayern',
        'Berlin',
        'Brandenburg',
        'Bremen',
        'Hamburg',
        'Hessen',
        'Mecklenburg-Vorpommern',
        'Niedersachsen',
        'Nordrhein-Westfalen',
        'Rheinland-Pfalz',
        'Saarland',
        'Sachsen',
        'Sachsen-Anhalt',
        'Schleswig-Holstein',
        'Thüringen'
      ];

      grouped = {};
      ALL_BUNDESLAENDER.forEach(bl => {
        grouped[bl] = [];
      });

      data.forEach(s => {
        if (grouped[s.bundesland]) {
          grouped[s.bundesland].push(s);
        }
      });

      Object.keys(grouped).forEach(bundesland => {
      grouped[bundesland].sort((a, b) =>
      a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
      );
      });

      let lastStatus = null;
      let dividerInserted = false;


      Object.keys(grouped)
  .sort((a, b) => {
    const aStatus = BUNDESLAND_STATUS[a] ? 1 : 0;
    const bStatus = BUNDESLAND_STATUS[b] ? 1 : 0;

    if (aStatus !== bStatus) {
      return aStatus - bStatus;
    }

    return a.localeCompare(b, 'de');
  })

.forEach(bundesland => {
        const hasAnerkennung = !!BUNDESLAND_STATUS[bundesland];
if (!dividerInserted) {
  bundeslandTable.innerHTML += `
    <tr class="bl-divider bl-divider-no">
      <td colspan="4">🔴 BUNDESLÄNDER TEILS ANERKANNT</td>
    </tr>
  `;
  dividerInserted = true;
  lastStatus = hasAnerkennung;
} else if (lastStatus !== hasAnerkennung) {
  bundeslandTable.innerHTML += `
    <tr class="bl-divider bl-divider-yes">
      <td colspan="4">🟢 BUNDESLÄNDER MIT ANERKENNUNG</td>
    </tr>
  `;
  lastStatus = hasAnerkennung;
}

bundeslandTable.innerHTML += `
<tr class="bl-row" data-bundesland="${bundesland}">
  <td colspan="4">
    <div class="bl-kachel">

      <button class="icon-btn toggle-btn">
        <i data-lucide="arrow-big-down-dash"></i>
      </button>

      <div class="bl-name">
        ${bundesland}
      </div>

      <div class="bl-status">
        <i
          data-lucide="${hasAnerkennung ? 'check-circle' : 'x-circle'}"
          class="${hasAnerkennung ? 'icon-yes' : 'icon-no'}"
        ></i>
      </div>

<div class="bl-notiz ${bundeslandMeta[bundesland]?.notiz ? 'has-note' : ''}"
     data-bundesland="${bundesland}"
     data-field="notiz">
  <i data-lucide="message-square"></i>
</div>

    </div>
  </td>
</tr>

<tr class="bl-content hidden" data-bundesland="${bundesland}">
  <td colspan="4">
    <div class="bl-inner"></div>
  </td>
</tr>
`;

      });

      if (openBundesland) {
        openSingleBundesland(openBundesland);
      }

      lucide.createIcons();
    });
}

function loadBundeslaender(selectedId = null) {
  bundeslandSelect.innerHTML =
    '<option value="" disabled selected>Bundesland auswählen</option>';

  fetch('/api/bundeslaender')
    .then(r => r.json())
    .then(list => {
      list.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.name;
        bundeslandSelect.appendChild(opt);
      });

      if (selectedId) {
        bundeslandSelect.value = selectedId;
      }
    });
}

function formatStatus(status) {
  switch (status) {
    case 'kein':
      return 'Kein Antrag';
    case 'in_pruefung':
      return 'In Prüfung';
    case 'genehmigt':
      return 'Genehmigt';
    default:
      return status;
  }
}

function openModal() {
  editId = null;
  clearError();
  clearInvalid();

  nameInput.value = '';
  typSelect.value = '';
  pfkCheckbox.checked = false;
  anerkennungCheckbox.checked = false;
  statusSelect.value = '';
  notizInput.value = '';

  loadBundeslaender();

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  document.addEventListener('keydown', escListener);
  modal.querySelector('.modal-backdrop').onclick = closeModal;
}

function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');

  document.removeEventListener('keydown', escListener);
}

function escListener(e) {
  if (e.key === 'Escape') closeModal();
}

function save() {
clearInvalid();

let invalid = false;

if (!bundeslandSelect.value) {
  markInvalid(bundeslandSelect);
  invalid = true;
}
if (!nameInput.value.trim()) {
  markInvalid(nameInput);
  invalid = true;
}
if (!typSelect.value) {
  markInvalid(typSelect);
  invalid = true;
}
if (!statusSelect.value) {
  markInvalid(statusSelect);
  invalid = true;
}

if (invalid) {
  showError('Bitte alle Pflichtfelder ausfüllen.');
  return;
}

  const payload = {
    bundesland_id: Number(bundeslandSelect.value),
    name: nameInput.value.trim(),
    typ: typSelect.value,
    pflegefachkraft: pfkCheckbox.checked,
    anerkennung: anerkennungCheckbox.checked,
    antrag_status: statusSelect.value,
    notiz: notizInput.value
  };

  const url = editId
    ? `/api/standorte/${editId}`
    : '/api/standorte';

  const method = editId ? 'PUT' : 'POST';

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
.then(async r => {
  if (r.status === 409) {
    openConfirm(
      'Dieser Standort existiert bereits.',
      'Möchtest du ihn trotzdem speichern?',
      () => {
        payload.force = true;

        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(() => {
          closeModal();
          load();
        });
      }
    );
    throw 'duplicate';
  }
  return r;
})
    .then(() => {
      closeModal();
      load();
    })
    .catch(() => {});
}

function updateTableHeaderVisibility() {
  const table = document.querySelector('.bundesland-table');
  const anyOpen = document.querySelector('.bl-row.open');

  table.classList.toggle('bl-open', !!anyOpen);
}

function editStandort(id) {
  editId = id;
  clearError();
  clearInvalid();

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('.modal-backdrop').onclick = closeModal;

  fetch(`/api/standorte/${id}`)
    .then(r => r.json())
    .then(s => {
      nameInput.value = s.name;
      typSelect.value = s.typ;
      pfkCheckbox.checked = !!s.pflegefachkraft;
      anerkennungCheckbox.checked = !!s.anerkennung;
      statusSelect.value = s.antrag_status;
      notizInput.value = s.notiz || '';

      loadBundeslaender(s.bundesland_id);
    });
}

function markInvalid(el) {
  el.classList.add('input-error');
}

function clearInvalid() {
  document
    .querySelectorAll('.input-error')
    .forEach(el => el.classList.remove('input-error'));
}

const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmText = document.getElementById('confirmText');
const confirmOk = document.getElementById('confirmOk');

function openConfirm(title, text, onOk) {
  confirmTitle.textContent = title;
  confirmText.textContent = text;

  confirmOk.onclick = () => {
    closeConfirm();
    onOk();
  };

  confirmModal.classList.remove('hidden');
}

function closeConfirm() {
  confirmModal.classList.add('hidden');
}

let deleteId = null;

const deleteModal = document.getElementById('deleteModal');
const deleteText = document.getElementById('deleteText');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

function openDelete(id, name) {
  deleteId = id;
  deleteText.textContent = `Möchtest du den Standort „${name}“ wirklich löschen?`;

  deleteConfirmBtn.onclick = confirmDelete;

  deleteModal.classList.remove('hidden');
}

function closeDelete() {
  deleteModal.classList.add('hidden');
  deleteId = null;
}

function confirmDelete() {
  fetch(`/api/standorte/${deleteId}`, {
    method: 'DELETE'
  })
    .then(() => {
      closeDelete();
      load();
    });
}

function nl2br(text) {
  return text.replace(/\n/g, '<br>');
}

deleteModal.querySelector('.modal-backdrop').onclick = closeDelete;
const noteModal = document.getElementById('noteModal');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');

function openNote(title, text) {
  noteTitle.textContent = title;
  noteContent.textContent = text;

  noteModal.classList.remove('hidden');
}

function closeNote() {
  noteModal.classList.add('hidden');
}

function formatTyp(typ) {
  switch (typ) {
    case 'kreisfrei':
      return 'Kreisfreie Stadt';
    case 'angehoerig':
      return 'Kreisangehörige Stadt';
    case 'Landkreis':
      return 'Landkreis';
    default:
      return typ;
  }
}

function handleNoteClick(btn) {
  const title = btn.dataset.title;
  const note = btn.dataset.note;

  openNote(title, note);
}

const notizCounter = document.getElementById('notizCounter');

notizInput.addEventListener('input', () => {
  notizCounter.textContent = `${notizInput.value.length} / 300 Zeichen`;
});

document.addEventListener('click', e => {
  if (e.target.closest('.bl-notiz')) return;

  const row = e.target.closest('.bl-row');
  if (!row) return;

  toggleBundesland(row.dataset.bundesland);
});


let openBundesland = null;

function toggleBundesland(bundesland) {
  if (openBundesland === bundesland) {
    closeAllBundeslaender();
    openBundesland = null;
    return;
  }

  openBundesland = bundesland;
  openSingleBundesland(bundesland);
}

function openSingleBundesland(bundesland) {
  document.querySelectorAll('.bl-row').forEach(row => {
    const isTarget = row.dataset.bundesland === bundesland;

    row.classList.toggle('hidden', !isTarget);
    row.classList.toggle('open', isTarget);
  });

  document.querySelectorAll('.bl-content').forEach(row => {
    const isTarget = row.dataset.bundesland === bundesland;
    row.classList.toggle('hidden', !isTarget);

    if (!isTarget) return;

    const inner = row.querySelector('.bl-inner');
    let standorte = grouped[bundesland] || [];

if (searchTerm) {
  standorte = standorte.filter(s =>
    s.name.toLowerCase().includes(searchTerm)
  );
}

    if (TABELLEN_BUNDESLAENDER.includes(bundesland)) {
      inner.innerHTML = `
      ${renderMetaKacheln(bundesland, standorte, true)}
      <div class="bl-table-spacing"></div>
      ${renderStandortTabelle(standorte)}
      `;

    } else {
      inner.innerHTML = renderMetaKacheln(bundesland, standorte, false);
    }
  });

  lucide.createIcons();
}

function closeAllBundeslaender() {
  document.querySelectorAll('.bl-row').forEach(row => {
    row.classList.remove('hidden', 'open');
  });

  document.querySelectorAll('.bl-content').forEach(row => {
    row.classList.add('hidden');
  });

  if (searchTerm) {
  filterBundeslaenderOverview();
}
}

function filterBundeslaenderOverview() {
  document.querySelectorAll('.bl-row').forEach(row => {
    const bundesland = row.dataset.bundesland;
    const standorte = grouped[bundesland] || [];

    const hasMatch = standorte.some(s =>
      s.name.toLowerCase().includes(searchTerm)
    );

    const contentRow = document.querySelector(
      `.bl-content[data-bundesland="${bundesland}"]`
    );

    const visible = !searchTerm || hasMatch;

    row.style.display = visible ? '' : 'none';
    if (contentRow) contentRow.style.display = visible ? '' : 'none';
  });
}

function findMatchingBundeslaender() {
  if (!searchTerm) return [];

  return Object.keys(grouped).filter(bundesland => {
    return grouped[bundesland].some(s =>
      s.name.toLowerCase().includes(searchTerm)
    );
  });
}

function renderMetaKacheln(bundesland, standorte, small = false) {
  const meta = bundeslandMeta[bundesland] || {};
  const hasTable = TABELLEN_BUNDESLAENDER.includes(bundesland);

  return `
    <div class="bl-kacheln ${small ? 'bl-kacheln-small' : ''}">

      ${renderMetaKachel(bundesland, 'abrechnung', 'Abrechnungsmöglichkeiten', meta.abrechnung)}
      ${renderMetaKachel(bundesland, 'anerkannt_fuer', 'Anerkannt für', meta.anerkannt_fuer)}
      ${renderMetaKachel(bundesland, 'anerkennung', 'Anerkennung', meta.anerkennung)}
      ${renderMetaKachel(bundesland, 'verordnung', 'Verordnung', meta.verordnung)}

      ${!hasTable
        ? renderMetaKachel(bundesland, 'kontakt', 'Kontakt', meta.kontakt)
        : ''}

    </div>
  `;
}

function renderMetaKachel(bundesland, field, title, value) {
  return `
    <div class="kachel kachel-text" data-field="${field}" data-bundesland="${bundesland}">
      
      <button
        class="kachel-edit"
        data-bundesland="${bundesland}"
        data-field="${field}"
        title="Bearbeiten"
      >
        <i data-lucide="pencil"></i>
      </button>

      <div class="kachel-label">${title}</div>

<div class="kachel-wert">
  ${renderMetaValue(field, value)}
</div>
    </div>
  `;
}

function renderStandortTabelle(standorte) {
  return `
    <table class="standorte-detail-table">
      <thead>
        <tr>
          <th></th>
          <th>Bundesland</th>
          <th>Standort</th>
          <th>Typ</th>
          <th>PFK</th>
          <th>Anerkennung</th>
          <th>Status</th>
          <th>Notiz</th>
        </tr>
      </thead>
      <tbody>
        ${standorte.map(s => `
          <tr>
<td class="action-cell">
  <button class="icon-btn" onclick="editStandort(${s.id})">
    <i data-lucide="edit-3"></i>
  </button>

  <button class="icon-btn danger"
    onclick="openDelete(${s.id}, '${s.name.replace(/'/g, "\\'")}')">
    <i data-lucide="trash-2"></i>
  </button>
</td>
            <td>${s.bundesland}</td>
            <td class="standort-cell">
  <span class="standort-name">${s.name}</span>

  <button
    class="icon-btn kontakt-btn"
    title="Kontakt"
    onclick="openKontaktModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')">
    <i data-lucide="phone"></i>
  </button>
</td>
            <td>${formatTyp(s.typ)}</td>

            <td class="icon-cell">
              <i data-lucide="${s.pflegefachkraft ? 'check-circle' : 'x-circle'}"
                 class="${s.pflegefachkraft ? 'icon-yes' : 'icon-no'}"></i>
            </td>

            <td class="icon-cell">
              <i data-lucide="${s.anerkennung ? 'check-circle' : 'x-circle'}"
                 class="${s.anerkennung ? 'icon-yes' : 'icon-no'}"></i>
            </td>

            <td class="status-cell">
              <span class="status-badge status-${s.antrag_status}">
                ${formatStatus(s.antrag_status)}
              </span>
            </td>

            <td class="notiz-cell">
              ${
                s.notiz?.trim()
                  ? `<button class="icon-btn note-btn"
                      data-title="${s.name}"
                      data-note="${s.notiz}"
                      onclick="handleNoteClick(this)">
                      <i data-lucide="file-text"></i>
                    </button>`
                  : '<span class="no-note">✕</span>'
              }
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderKachelLayout(bundesland) {
  const meta = bundeslandMeta[bundesland] || {
    abrechnung: '',
    anerkannt_fuer: '',
    anerkennung: ''
  };

  return `
    <div class="bl-kacheln">

      ${renderTextKachel(
        'Abrechnungsmöglichkeiten',
        meta.abrechnung,
        bundesland,
        'abrechnung'
      )}

      ${renderTextKachel(
        'Anerkannt für',
        meta.anerkannt_fuer,
        bundesland,
        'anerkannt_fuer'
      )}

      ${renderTextKachel(
        'Anerkennung',
        meta.anerkennung,
        bundesland,
        'anerkennung'
      )}

    </div>
  `;
}

function renderTextKachel(title, value, bundesland, field) {
  return `
    <div class="kachel kachel-text">
      <button class="kachel-edit"
        data-bundesland="${bundesland}"
        data-field="${field}"
        title="Bearbeiten">
        <i data-lucide="edit-3"></i>
      </button>

      <div class="kachel-label">${title}</div>
      <div class="kachel-wert">
        ${value || '<span class="kachel-empty">– kein Eintrag –</span>'}
      </div>
    </div>
  `;
}

const standortSearch = document.getElementById('standortSearch');
const clearSearchBtn = document.getElementById('clearSearch');

standortSearch.addEventListener('input', e => {
  searchTerm = e.target.value.toLowerCase();

  clearSearchBtn.classList.toggle('hidden', !searchTerm);

  const matches = findMatchingBundeslaender();

  if (!searchTerm) {
    openBundesland = null;
    closeAllBundeslaender();
    filterBundeslaenderOverview();
    return;
  }

  if (matches.length === 1) {
    openBundesland = matches[0];
    openSingleBundesland(matches[0]);
    return;
  }

  openBundesland = null;
  closeAllBundeslaender();
  filterBundeslaenderOverview();
});

clearSearchBtn.addEventListener('click', () => {
  standortSearch.value = '';
  searchTerm = '';

  clearSearchBtn.classList.add('hidden');

  openBundesland = null;
  closeAllBundeslaender();
  filterBundeslaenderOverview();

  standortSearch.focus();
});

function handleKachelClick(action, bundesland) {
  switch (action) {
    case 'total':
      alert(`Alle Standorte in ${bundesland}`);
      break;

    case 'anerkennung':
      alert(`Anerkennungen in ${bundesland}`);
      break;

    case 'pfk':
      alert(`PFK in ${bundesland}`);
      break;
  }
}

document.addEventListener('click', e => {

  const editBtn = e.target.closest('.kachel-edit');
  if (editBtn) {
    e.stopPropagation();

    openBundeslandMetaModal(
      editBtn.dataset.bundesland,
      editBtn.dataset.field
    );
    return;
  }
});

let currentMetaBL = null;
let currentMetaField = null;
let currentKontaktStandortId = null;

function openBundeslandMetaModal(bundesland, field) {
  currentMetaBL = bundesland;
  currentMetaField = field;

  const meta = bundeslandMeta[bundesland] || {};
  document.getElementById('metaTitle').textContent =
    `${bundesland} – ${META_LABELS[field] || field}`;


  document.getElementById('metaTextarea').value =
    meta[field] || '';

  document.getElementById('metaModal').classList.remove('hidden');
  const modal = document.getElementById('metaModal');
  const backdrop = modal.querySelector('.modal-backdrop');

  if (backdrop) {
    backdrop.onclick = closeMetaModal;
  }
}

function closeMetaModal() {
  document.getElementById('metaModal').classList.add('hidden');
}

function saveMeta() {
  const value = document.getElementById('metaTextarea').value.trim();

  fetch('/api/standorte/bundeslaender/meta', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bundesland: currentMetaBL,
      field: currentMetaField,
      value
    })
  })
  .then(() => {
    if (!bundeslandMeta[currentMetaBL]) {
      bundeslandMeta[currentMetaBL] = {};
    }

    bundeslandMeta[currentMetaBL][currentMetaField] = value;

    closeMetaModal();
    openSingleBundesland(currentMetaBL);
  });
}

function limitText(text, max = 300) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + '…';
}

function formatKontaktText(text) {
  if (!text) return '';

  const LABELS = [
    'Ansprechpartner',
    'Amt',
    'Telefon',
    'E-Mail',
    'Email'
  ];

  let formatted = text;

  LABELS.forEach(label => {
    const regex = new RegExp(`(${label}\\s*:)`, 'gi');
    formatted = formatted.replace(
      regex,
      '<span class="kontakt-label">$1</span>'
    );
  });

  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

const scrollToTopBtn = document.getElementById("scrollToTop");

if (scrollToTopBtn) {

  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

}

function openKontaktModal(id, name) {
  currentKontaktStandortId = id;

  document.getElementById('kontaktTitle').textContent =
    `Kontakt – ${name}`;

  fetch(`/api/standorte/${id}/kontakt`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('kontaktName').value = data.name || '';
      document.getElementById('kontaktTelefon').value = data.telefon || '';
      document.getElementById('kontaktEmail').value = data.email || '';
      document.getElementById('kontaktNotiz').value = data.notiz || '';
    });

  document.getElementById('kontaktModal').classList.remove('hidden');
}

function closeKontaktModal() {
  document.getElementById('kontaktModal').classList.add('hidden');
  currentKontaktStandortId = null;
}

function saveKontakt() {
  const payload = {
    name: document.getElementById('kontaktName').value.trim(),
    telefon: document.getElementById('kontaktTelefon').value.trim(),
    email: document.getElementById('kontaktEmail').value.trim(),
    notiz: document.getElementById('kontaktNotiz').value.trim()
  };

  fetch(`/api/standorte/${currentKontaktStandortId}/kontakt`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(() => {
    closeKontaktModal();
  });
}

document.addEventListener('click', e => {
  const notizBtn = e.target.closest('.bl-notiz');
  if (!notizBtn) return;

  e.stopPropagation();

  const bundesland = notizBtn.dataset.bundesland;
  const field = notizBtn.dataset.field;

  openBundeslandMetaModal(bundesland, field);
});

function renderMetaValue(field, value) {
  if (!value || !value.trim()) {
    return '<span class="kachel-empty">– kein Eintrag –</span>';
  }

  if (field === 'verordnung') {
    const urlMatch = value.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : null;

    let text = value;
    if (url) text = text.replace(url, '');

    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();

    let html = '<div class="meta-verordnung">';

    if (url) {
      html += `<a href="${url}" class="meta-link" target="_blank" rel="noopener noreferrer">📄 Verordnung öffnen</a>`;
    }

    if (text) {
      html += `<div class="meta-text">${nl2br(limitText(text, 300))}</div>`;
    }

    html += '</div>';

    return html;
  }

  return limitText(value, 300);
}
window.closeModal = closeModal;
window.editStandort = editStandort;
window.openDelete = openDelete;
window.openKontaktModal = openKontaktModal;
window.closeKontaktModal = closeKontaktModal;
window.saveKontakt = saveKontakt;
window.closeDelete = closeDelete;
window.openNote = openNote;
window.closeNote = closeNote;
window.handleNoteClick = handleNoteClick;
window.openConfirm = openConfirm;
window.closeConfirm = closeConfirm;
window.save = save;
window.closeMetaModal = closeMetaModal;
window.saveMeta = saveMeta;

    console.log("INIT OK");

  } catch (err) {
    console.error("INIT CRASH:", err);
  }
};
