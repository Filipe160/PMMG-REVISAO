// chave no localStorage
const STORAGE_KEY = "revisoesPMMG_v3";
// intervalos em dias
const INTERVALS = [7, 14, 20, 30];

document.addEventListener("DOMContentLoaded", () => {
  const disciplinaSelect = document.getElementById("disciplinaSelect");
  const conteudoInput = document.getElementById("conteudoInput");
  const dataInput = document.getElementById("dataInput");
  const addButton = document.getElementById("addButton");
  const clearAllBtn = document.getElementById("clearAll");
  const toggleThemeBtn = document.getElementById("toggleTheme");

  // set default date = hoje
  dataInput.value = new Date().toISOString().slice(0, 10);

  let state = loadState();

  // render inicial
  renderAll();

  addButton.addEventListener("click", () => {
    const disciplina = disciplinaSelect.value;
    const conteudo = conteudoInput.value.trim();
    const data = dataInput.value;

    if (!disciplina) return alert("Escolha a disciplina!");
    if (!conteudo) return alert("Digite o conteúdo estudado!");
    if (!data) return alert("Escolha a data do estudo!");

    const item = {
      id: Date.now().toString(36),
      conteudo,
      dataBase: data, // ISO yyyy-mm-dd
      createdAt: new Date().toISOString()
    };

    state[disciplina].push(item);
    saveState();
    renderAll();

    // limpar campos
    conteudoInput.value = "";
    dataInput.value = new Date().toISOString().slice(0, 10);
  });

  clearAllBtn.addEventListener("click", () => {
    if (!confirm("Apagar todos os registros?")) return;
    state = createEmptyState();
    saveState();
    renderAll();
  });

  toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("temaPMMG", document.body.classList.contains("dark") ? "dark" : "light");
  });

  // aplica tema salvo
  if (localStorage.getItem("temaPMMG") === "dark") {
    document.body.classList.add("dark");
  }

  // que carrega estado do localStorage ou cria inicial
  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyState();
    try {
      const parsed = JSON.parse(raw);
      // garantir chaves
      const base = createEmptyState();
      return Object.assign(base, parsed);
    } catch (e) {
      return createEmptyState();
    }
  }

  function createEmptyState() {
    return {
      portugues: [],
      matematica: [],
      ingles: [],
      direito: [],
      literatura: []
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function deleteItem(disciplina, id) {
    state[disciplina] = state[disciplina].filter(it => it.id !== id);
    saveState();
    renderAll();
  }

  // calcula datas de revisão a partir da dataBase (yyyy-mm-dd)
  function calcularRevisoes(isoDate) {
    const base = new Date(isoDate + "T00:00:00");
    return INTERVALS.map(days => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return { days, iso: d.toISOString().slice(0, 10), label: formatDateBR(d) };
    });
  }

  function formatDateBR(d) {
    return d.toLocaleDateString("pt-BR");
  }

  function renderAll() {
    renderList("portugues", "lista-portugues");
    renderList("matematica", "lista-matematica");
    renderList("ingles", "lista-ingles");
    renderList("direito", "lista-direito");
    renderList("literatura", "lista-literatura");
  }

  function renderList(key, elId) {
    const ul = document.getElementById(elId);
    ul.innerHTML = "";

    const arr = state[key];
    if (!arr || arr.length === 0) {
      ul.innerHTML = `<li class="item"><div class="item-left" style="color:var(--muted)">Nenhum registro</div></li>`;
      return;
    }

    // ordenar por dataBase mais recente primeiro
    const sorted = [...arr].sort((a,b) => new Date(b.dataBase) - new Date(a.dataBase));

    sorted.forEach(it => {
      const li = document.createElement("li");
      li.className = "item";

      const left = document.createElement("div");
      left.className = "item-left";

      const titulo = document.createElement("strong");
      titulo.textContent = `${it.conteudo} — (${it.dataBase})`;

      const revisoes = calcularRevisoes(it.dataBase);
      const revDiv = document.createElement("div");
      revDiv.className = "revisoes";

      revisoes.forEach(r => {
        // marcar se já passou
        const hoje = new Date().toISOString().slice(0,10);
        const passed = r.iso <= hoje;
        const mark = passed ? "✔️ " : "";
        const span = document.createElement("div");
        span.textContent = `${mark}${r.days} dias → ${r.label}`;
        if (passed) span.style.opacity = "0.7";
        revDiv.appendChild(span);
      });

      left.appendChild(titulo);
      left.appendChild(revDiv);

      const actions = document.createElement("div");
      actions.className = "actions";

      const delBtn = document.createElement("button");
      delBtn.className = "btn delete";
      delBtn.textContent = "Excluir";
      delBtn.addEventListener("click", () => {
        if (!confirm("Excluir este registro?")) return;
        deleteItem(key, it.id);
      });

      const resetBtn = document.createElement("button");
      resetBtn.className = "btn small";
      resetBtn.textContent = "Marcar hoje";
      resetBtn.title = "Atualizar data do estudo para hoje (recalcula revisões)";
      resetBtn.addEventListener("click", () => {
        if (!confirm("Marcar esta matéria como estudada hoje?")) return;
        it.dataBase = new Date().toISOString().slice(0,10);
        saveState();
        renderAll();
      });

      actions.appendChild(resetBtn);
      actions.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(actions);
      ul.appendChild(li);
    });
  }
});
