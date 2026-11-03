/* ===== Resaltado de sintaxis sencillo (tema oscuro) ===== */
const KEYWORDS = {
  html: [],
  jinja: ["if", "elif", "else", "endif", "for", "endfor", "in", "extends", "block", "endblock",
          "include", "set", "macro", "endmacro", "loop"],
  css: [],
  js: ["let", "const", "var", "function", "return", "if", "else", "for", "while", "new", "true", "false", "null"],
  sql: ["CREATE", "TABLE", "INSERT", "INTO", "VALUES", "SELECT", "FROM", "WHERE", "UPDATE", "SET", "DELETE",
        "ORDER", "BY", "DESC", "ASC", "LIMIT", "GROUP", "COUNT", "AS", "INNER", "JOIN", "ON", "ALTER", "ADD",
        "COLUMN", "DROP", "PRIMARY", "KEY", "NOT", "NULL", "AND", "OR", "LIKE", "INTEGER", "TEXT"],
};

function escaparHTML(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function resaltar(texto, lang) {
  const kws = new Set(KEYWORDS[lang] || []);
  const sql = lang === "sql";
  const comentario = sql ? "--.*" : "\\/\\/.*";
  const re = new RegExp(
    "(&lt;!--[\\s\\S]*?--&gt;|\\/\\*[\\s\\S]*?\\*\\/|\\{#[\\s\\S]*?#\\}|" + comentario + ")" + // 1 comentario
    "|(\"[^\"\\n]*\"|'[^'\\n]*')" +                                                           // 2 cadena
    "|(\\{\\{[\\s\\S]*?\\}\\}|\\{%[\\s\\S]*?%\\})" +                                           // 3 jinja
    "|(&lt;\\/?[a-zA-Z][a-zA-Z0-9]*|&lt;!DOCTYPE)" +                                          // 4 etiqueta html
    "|\\b(\\d+(?:\\.\\d+)?)\\b" +                                                             // 5 número
    "|\\b([A-Za-z_][A-Za-z0-9_]*)\\b(\\()?",                                                  // 6 palabra / 7 función
    "g"
  );
  return escaparHTML(texto).replace(re, (m, com, str, jin, tag, num, pal, par) => {
    if (com) return `<span class="tk-com">${com}</span>`;
    if (str) return `<span class="tk-str">${str}</span>`;
    if (jin) return `<span class="tk-jin">${jin}</span>`;
    if (tag) return `<span class="tk-tag">${tag}</span>`;
    if (num) return `<span class="tk-num">${num}</span>`;
    if (pal) {
      const clave = sql ? pal.toUpperCase() : pal;
      if (kws.has(clave)) return `<span class="tk-kw">${pal}</span>${par || ""}`;
      if (par) return `<span class="tk-fn">${pal}</span>${par}`;
    }
    return m;
  });
}

document.querySelectorAll("pre[data-lang]").forEach((pre) => {
  const code = pre.querySelector("code");
  code.innerHTML = resaltar(code.textContent, pre.dataset.lang);
});

/* ===== Acordeón de conceptos ===== */
document.querySelectorAll(".concepto-cab").forEach((btn) => {
  btn.addEventListener("click", () => btn.parentElement.classList.toggle("abierto"));
});

const btnAbrir = document.getElementById("btn-abrir");
if (btnAbrir) {
  btnAbrir.addEventListener("click", () => {
    const tarjetas = document.querySelectorAll(".concepto");
    const abrir = btnAbrir.textContent.includes("Expandir");
    tarjetas.forEach((t) => t.classList.toggle("abierto", abrir));
    btnAbrir.textContent = abrir ? "Contraer todo" : "Expandir todo";
  });
}

/* ===== Buscador ===== */
const buscador = document.getElementById("buscador");
if (buscador) {
  buscador.addEventListener("input", () => {
    const q = buscador.value.toLowerCase().trim();
    let visibles = 0;
    document.querySelectorAll(".concepto").forEach((t) => {
      const coincide = t.textContent.toLowerCase().includes(q);
      t.style.display = coincide ? "" : "none";
      if (coincide) visibles++;
    });
    document.getElementById("sin-resultados").hidden = visibles > 0;
  });
}

/* ===== Botón copiar ===== */
document.querySelectorAll(".copiar").forEach((b) => {
  b.addEventListener("click", async () => {
    const texto = b.closest(".codigo").querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(texto);
      b.textContent = "¡Copiado!";
    } catch (e) {
      b.textContent = "Error";
    }
    setTimeout(() => (b.textContent = "Copiar"), 1500);
  });
});

/* ===== Quiz interactivo ===== */
const quizBox = document.getElementById("quiz");
if (quizBox) {
  const preguntas = JSON.parse(document.getElementById("quiz-data").textContent);
  const contenedor = document.getElementById("quiz-contenido");
  const slug = quizBox.dataset.slug;
  let indice = 0, puntos = 0;

  function mostrar() {
    if (indice >= preguntas.length) return final();
    const q = preguntas[indice];
    contenedor.innerHTML = `
      <div class="progreso-quiz">Pregunta ${indice + 1} de ${preguntas.length}</div>
      <p class="pregunta"></p>
      <div class="opciones"></div>`;
    contenedor.querySelector(".pregunta").textContent = q.p;
    const cont = contenedor.querySelector(".opciones");
    q.o.forEach((texto, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = texto;
      b.addEventListener("click", () => responder(i, cont));
      cont.appendChild(b);
    });
  }

  function responder(i, cont) {
    const q = preguntas[indice];
    const botones = [...cont.children];
    botones.forEach((b) => (b.disabled = true));
    botones[q.r].classList.add("correcta");
    if (i === q.r) puntos++;
    else botones[i].classList.add("incorrecta");
    const sig = document.createElement("button");
    sig.type = "button";
    sig.className = "quiz-sig";
    sig.textContent = indice === preguntas.length - 1 ? "Ver resultado" : "Siguiente →";
    sig.addEventListener("click", () => { indice++; mostrar(); });
    contenedor.appendChild(sig);
  }

  function final() {
    try {
      const previo = Number(localStorage.getItem("labook:" + slug)) || 0;
      localStorage.setItem("labook:" + slug, Math.max(previo, puntos));
    } catch (e) {}
    contenedor.innerHTML = `
      <p class="resultado">Tu puntaje: <strong>${puntos} / ${preguntas.length}</strong></p>
      <button type="button" class="quiz-sig" id="reiniciar">Intentar de nuevo</button>`;
    document.getElementById("reiniciar").addEventListener("click", () => {
      indice = 0; puntos = 0; mostrar();
    });
  }
  mostrar();
}

/* ===== Progreso guardado (menú e inicio) ===== */
document.querySelectorAll("[data-progreso]").forEach((el) => {
  try {
    const mejor = localStorage.getItem("labook:" + el.dataset.progreso);
    if (mejor !== null) el.textContent = "✔ " + mejor;
  } catch (e) {}
});
