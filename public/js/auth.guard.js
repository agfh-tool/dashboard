const AUTH_KEY = "afh_access_granted";

// replace later
const ACCESS_PASSWORD = "afh2026."; // pw

function isAuthorized() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function setAuthorized() {
  sessionStorage.setItem(AUTH_KEY, "1");
}

function createPasswordGate() {

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "authGate";

  modal.innerHTML = `
    <div class="modal-backdrop"></div>

    <div class="modal-box" style="max-width:420px">
      <div class="modal-header">
        <h3>Zugriff geschützt</h3>
      </div>

      <div class="modal-body">
        <p style="margin-top:0">
          Bitte Passwort eingeben, um fortzufahren.
        </p>

        <input 
          id="authInput"
          type="password"
          placeholder="Passwort"
          autocomplete="off"
        />

        <div id="authError" class="form-error hidden">
          Falsches Passwort
        </div>
      </div>

      <div class="modal-footer">
        <button id="authSubmit" class="btn-primary">
          Öffnen
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = modal.querySelector("#authInput");
  const submit = modal.querySelector("#authSubmit");
  const error = modal.querySelector("#authError");

  function check() {

    if (input.value === ACCESS_PASSWORD) {
      setAuthorized();
      modal.remove();
      document.dispatchEvent(new Event("auth:granted"));
      return;
    }

    error.classList.remove("hidden");
    input.classList.add("input-error");
  }

  submit.addEventListener("click", check);

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") check();
  });

  setTimeout(() => input.focus(), 50);
}

//global guard
function requireAuth() {

  if (isAuthorized()) {
    document.dispatchEvent(new Event("auth:granted"));
    return;
  }

  createPasswordGate();
}

window.requireAuth = requireAuth;
window.isAuthorized = isAuthorized;
