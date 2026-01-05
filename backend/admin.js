// backend/admin.js

const API_BASE = `http://${location.hostname}:3000`;

// ----------------------------
// TOKEN / AUTH
// ----------------------------
function getToken() {
  return sessionStorage.getItem("token");
}

function exigirLogin() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  // Só setar Content-Type quando NÃO for FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    sessionStorage.removeItem("token");
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    throw new Error("Não autorizado");
  }

  return res;
}

// ----------------------------
// UI HELPERS
// ----------------------------
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.appendChild(c);
  return node;
}

function moneyToNumber(v) {
  if (v == null) return NaN;
  const s = String(v).replace(",", ".").trim();
  return Number(s);
}

function showToast(msg, type = "ok") {
  const wrapId = "sb-toast-wrap";
  let wrap = document.getElementById(wrapId);
  if (!wrap) {
    wrap = el("div", { id: wrapId, class: "sb-toast-wrap" });
    document.body.appendChild(wrap);
  }
  const t = el("div", { class: `sb-toast ${type}`, html: msg });
  wrap.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 250);
  }, 2600);
}

function confirmDanger(msg) {
  return window.confirm(msg);
}

// ----------------------------
// TOP BAR (email + logout)
// ----------------------------
async function carregarAdmin() {
  const spanEmail = document.getElementById("admin-email");
  if (!spanEmail) return;

  try {
    const res = await apiFetch("/me", { method: "GET" });
    if (!res.ok) return;
    const data = await res.json();
    const email = data?.user?.email || "";
    spanEmail.textContent = email ? `Logado: ${email}` : "Logado";
  } catch (err) {
    console.error(err);
  }
}

function configurarLogout() {
  const btnLogout = document.getElementById("btn-logout");
  if (!btnLogout) return;

  btnLogout.addEventListener("click", () => {
    sessionStorage.removeItem("token");
    window.location.href = "login.html";
  });
}

// ----------------------------
// STATUS LOJA
// ----------------------------
async function carregarStatusLoja() {
  const statusEl = document.getElementById("status-loja");
  if (!statusEl) return;

  try {
    const res = await fetch(`${API_BASE}/status-loja`, { cache: "no-store" });
    const data = await res.json();

    if (data.lojaAberta) {
      statusEl.textContent = "🟢 Aberta";
      statusEl.style.color = "#16a34a";
    } else {
      statusEl.textContent = "🔴 Fechada";
      statusEl.style.color = "#dc2626";
    }
  } catch (err) {
    statusEl.textContent = "Erro ao carregar status";
    statusEl.style.color = "#6b7280";
  }
}

async function alterarStatus(lojaAberta) {
  const statusEl = document.getElementById("status-loja");
  if (statusEl) {
    statusEl.textContent = "Atualizando...";
    statusEl.style.color = "#6b7280";
  }

  try {
    const res = await apiFetch("/alterar-status-loja", {
      method: "POST",
      body: JSON.stringify({ lojaAberta }),
    });

    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      showToast(msg.message || "Erro ao alterar status", "err");
    } else {
      showToast("Status atualizado!", "ok");
    }
    await carregarStatusLoja();
  } catch (err) {
    console.error(err);
    showToast("Erro ao alterar status da loja", "err");
    await carregarStatusLoja();
  }
}

// ----------------------------
// PAINEL: ITENS (CRUD)
// ----------------------------
let itensCache = [];
let adicionaisCache = [];

async function listarItens() {
  const res = await fetch(`${API_BASE}/buscar/hamburguers?t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Falha ao listar itens");
  return await res.json();
}

async function listarAdicionais() {
  const res = await fetch(`${API_BASE}/adicionais?t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Falha ao listar adicionais");
  return await res.json();
}

function resolveImagemUrl(imagemUrl) {
  if (!imagemUrl) return "";
  if (imagemUrl.startsWith("/uploads") || imagemUrl.startsWith("/img")) {
    return `${API_BASE}${imagemUrl}`;
  }
  return imagemUrl;
}

function getMainContainer() {
  return document.querySelector("main.painel-container") || document.body;
}

function ensurePanelStructure() {
  const main = getMainContainer();

  // Se já existe um container novo, não duplica
  if (document.getElementById("sb-admin-root")) return;

  const root = el("div", { id: "sb-admin-root", class: "sb-root" });

  // Cards
  const cardItens = el("section", { class: "sb-card" }, [
    el("div", { class: "sb-card-header" }, [
      el("h3", { class: "sb-title", html: "🍔 Itens do Cardápio" }),
      el("button", {
        class: "sb-btn sb-btn-secondary",
        type: "button",
        id: "btn-recarregar-itens",
        html: "Recarregar",
      }),
    ]),
    el("p", {
      class: "sb-muted",
      html:
        'Adicione/edite itens. Categorias: <b>space</b>, <b>smash</b>, <b>combo</b>, <b>porcoes</b>, <b>bebidas</b>.',
    }),
    el("div", { id: "sb-form-item" }),
    el("div", { class: "sb-divider" }),
    el("div", { id: "sb-itens-list" }),
  ]);

  const cardAdicionais = el("section", { class: "sb-card" }, [
    el("div", { class: "sb-card-header" }, [
      el("h3", { class: "sb-title", html: "➕ Adicionais" }),
      el("button", {
        class: "sb-btn sb-btn-secondary",
        type: "button",
        id: "btn-recarregar-adicionais",
        html: "Recarregar",
      }),
    ]),
    el("p", {
      class: "sb-muted",
      html: "Aqui você controla nome, preço e se o adicional está ativo (aparece no modal do cardápio).",
    }),
    el("div", { id: "sb-form-adicional" }),
    el("div", { class: "sb-divider" }),
    el("div", { id: "sb-adicionais-list" }),
  ]);

  root.appendChild(cardItens);
  root.appendChild(cardAdicionais);

  main.appendChild(root);

  // Botões recarregar
  document
    .getElementById("btn-recarregar-itens")
    .addEventListener("click", async () => {
      await carregarItensUI();
    });

  document
    .getElementById("btn-recarregar-adicionais")
    .addEventListener("click", async () => {
      await carregarAdicionaisUI();
    });
}

function renderFormNovoItem() {
  const mount = document.getElementById("sb-form-item");
  if (!mount) return;

  mount.innerHTML = "";
  const form = el("form", { class: "sb-form" });

  const nome = el("input", { class: "sb-input", placeholder: "Nome", required: "true" });
  const preco = el("input", {
    class: "sb-input",
    placeholder: "Preço (ex: 25.90)",
    required: "true",
    inputmode: "decimal",
  });
  const descricao = el("textarea", { class: "sb-textarea", placeholder: "Descrição" });

  const categoria = el("input", {
    class: "sb-input",
    placeholder: 'Categorias (JSON ou separado por vírgula). Ex: space, smash',
    required: "true",
  });

  const imagem = el("input", { class: "sb-input", type: "file", accept: "image/*" });

  const indisponivel = el("input", { type: "checkbox" });
  const novoItem = el("input", { type: "checkbox" });

  const row1 = el("div", { class: "sb-grid" }, [
    el("div", {}, [el("label", { class: "sb-label", html: "Nome" }), nome]),
    el("div", {}, [el("label", { class: "sb-label", html: "Preço" }), preco]),
  ]);

  const row2 = el("div", { class: "sb-grid" }, [
    el("div", { style: "grid-column: 1 / -1" }, [
      el("label", { class: "sb-label", html: "Descrição" }),
      descricao,
    ]),
  ]);

  const row3 = el("div", { class: "sb-grid" }, [
    el("div", { style: "grid-column: 1 / -1" }, [
      el("label", { class: "sb-label", html: "Categorias" }),
      categoria,
    ]),
  ]);

  const row4 = el("div", { class: "sb-grid" }, [
    el("div", {}, [el("label", { class: "sb-label", html: "Imagem (opcional)" }), imagem]),
    el("div", { class: "sb-inline" }, [
      el("label", { class: "sb-check" }, [
        indisponivel,
        el("span", { html: "Indisponível" }),
      ]),
      el("label", { class: "sb-check" }, [
        novoItem,
        el("span", { html: "Novo" }),
      ]),
    ]),
  ]);

  const btn = el("button", {
    class: "sb-btn sb-btn-primary",
    type: "submit",
    html: "Adicionar Item",
  });

  form.appendChild(row1);
  form.appendChild(row2);
  form.appendChild(row3);
  form.appendChild(row4);
  form.appendChild(el("div", { class: "sb-actions" }, [btn]));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const precoNum = moneyToNumber(preco.value);
    if (Number.isNaN(precoNum)) {
      showToast("Preço inválido", "err");
      return;
    }

    // categorias: aceita JSON ou "a,b,c"
    let cats = [];
    const raw = categoria.value.trim();
    try {
      if (raw.startsWith("[") || raw.startsWith("{")) {
        const parsed = JSON.parse(raw);
        cats = Array.isArray(parsed) ? parsed : [];
      } else {
        cats = raw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      cats = raw.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (!cats.length) {
      showToast("Informe ao menos 1 categoria", "err");
      return;
    }

    const fd = new FormData();
    fd.append("nome", nome.value.trim());
    fd.append("descricao", descricao.value.trim());
    fd.append("preco", String(precoNum));
    fd.append("categoria", JSON.stringify(cats));
    fd.append("indisponivel", String(indisponivel.checked));
    fd.append("novoItem", String(novoItem.checked));
    if (imagem.files?.[0]) fd.append("imagem", imagem.files[0]);

    try {
      const res = await apiFetch("/adicionar/hamburguers", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        showToast(msg.message || "Erro ao adicionar item", "err");
        return;
      }

      showToast("Item adicionado!", "ok");
      form.reset();
      await carregarItensUI();
    } catch (err) {
      console.error(err);
      showToast("Erro ao adicionar item", "err");
    }
  });

  mount.appendChild(form);
}

function renderItensList(itens) {
  const mount = document.getElementById("sb-itens-list");
  if (!mount) return;

  mount.innerHTML = "";

  if (!itens.length) {
    mount.appendChild(
      el("div", { class: "sb-empty", html: "Nenhum item cadastrado ainda." })
    );
    return;
  }

  const table = el("table", { class: "sb-table" });
  table.appendChild(
    el("thead", {}, [
      el("tr", {}, [
        el("th", { html: "Imagem" }),
        el("th", { html: "Nome" }),
        el("th", { html: "Preço" }),
        el("th", { html: "Categorias" }),
        el("th", { html: "Status" }),
        el("th", { html: "Ações" }),
      ]),
    ])
  );

  const tbody = el("tbody");
  for (const item of itens) {
    const img = el("img", {
      class: "sb-thumb",
      src: resolveImagemUrl(item.imagem_url) || "",
      alt: item.nome || "",
      onerror: function () {
        this.style.display = "none";
      },
    });

    const inNome = el("input", { class: "sb-input sb-input-sm", value: item.nome || "" });
    const inPreco = el("input", {
      class: "sb-input sb-input-sm",
      value: Number(item.preco ?? 0).toFixed(2),
      inputmode: "decimal",
    });
    const inCat = el("input", {
      class: "sb-input sb-input-sm",
      value: Array.isArray(item.categoria) ? item.categoria.join(", ") : "",
      placeholder: "space, smash...",
    });

    const ckInd = el("input", { type: "checkbox" });
    ckInd.checked = !!item.indisponivel;

    const ckNovo = el("input", { type: "checkbox" });
    ckNovo.checked = !!item.novoItem;

    const fileImg = el("input", {
      class: "sb-input sb-input-sm",
      type: "file",
      accept: "image/*",
    });

    const btnSalvar = el("button", {
      class: "sb-btn sb-btn-primary sb-btn-sm",
      type: "button",
      html: "Salvar",
    });

    const btnExcluir = el("button", {
      class: "sb-btn sb-btn-danger sb-btn-sm",
      type: "button",
      html: "Excluir",
    });

    btnSalvar.addEventListener("click", async () => {
      const precoNum = moneyToNumber(inPreco.value);
      if (Number.isNaN(precoNum)) {
        showToast("Preço inválido", "err");
        return;
      }

      const cats = inCat.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!cats.length) {
        showToast("Categorias inválidas", "err");
        return;
      }

      const fd = new FormData();
      fd.append("nome", inNome.value.trim());
      fd.append("preco", String(precoNum));
      fd.append("categoria", JSON.stringify(cats));
      fd.append("indisponivel", String(ckInd.checked));
      fd.append("novoItem", String(ckNovo.checked));
      if (fileImg.files?.[0]) fd.append("imagem", fileImg.files[0]);

      try {
        const res = await apiFetch(`/editar/hamburguer/${item.id}`, {
          method: "PUT",
          body: fd,
        });

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          showToast(msg.message || "Erro ao salvar item", "err");
          return;
        }

        showToast("Item salvo!", "ok");
        await carregarItensUI();
      } catch (err) {
        console.error(err);
        showToast("Erro ao salvar item", "err");
      }
    });

    btnExcluir.addEventListener("click", async () => {
      if (!confirmDanger(`Excluir "${item.nome}"?`)) return;

      try {
        const res = await apiFetch(`/deletar/hamburguer/${item.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          showToast(msg.message || "Erro ao excluir item", "err");
          return;
        }

        showToast("Item excluído!", "ok");
        await carregarItensUI();
      } catch (err) {
        console.error(err);
        showToast("Erro ao excluir item", "err");
      }
    });

    const statusCell = el("div", { class: "sb-stack" }, [
      el("label", { class: "sb-check" }, [ckInd, el("span", { html: "Indisponível" })]),
      el("label", { class: "sb-check" }, [ckNovo, el("span", { html: "Novo" })]),
      el("div", { class: "sb-muted sb-small", html: "Trocar imagem:" }),
      fileImg,
    ]);

    const tr = el("tr", {}, [
      el("td", {}, [img]),
      el("td", {}, [inNome]),
      el("td", {}, [inPreco]),
      el("td", {}, [inCat]),
      el("td", {}, [statusCell]),
      el("td", {}, [
        el("div", { class: "sb-actions" }, [btnSalvar, btnExcluir]),
      ]),
    ]);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  mount.appendChild(table);
}

async function carregarItensUI() {
  const mount = document.getElementById("sb-itens-list");
  if (mount) mount.innerHTML = `<div class="sb-loading">Carregando itens...</div>`;

  try {
    itensCache = await listarItens();
    renderItensList(itensCache);
  } catch (err) {
    console.error(err);
    if (mount) mount.innerHTML = `<div class="sb-empty">Erro ao carregar itens.</div>`;
    showToast("Erro ao carregar itens", "err");
  }
}

// ----------------------------
// ADICIONAIS (CRUD)
// ----------------------------
function renderFormNovoAdicional() {
  const mount = document.getElementById("sb-form-adicional");
  if (!mount) return;

  mount.innerHTML = "";

  const form = el("form", { class: "sb-form sb-form-inline" });

  const nome = el("input", { class: "sb-input", placeholder: "Nome do adicional", required: "true" });
  const preco = el("input", {
    class: "sb-input",
    placeholder: "Preço (ex: 5.00)",
    required: "true",
    inputmode: "decimal",
  });
  const ativo = el("input", { type: "checkbox" });
  ativo.checked = true;

  const btn = el("button", {
    class: "sb-btn sb-btn-primary",
    type: "submit",
    html: "Adicionar",
  });

  form.appendChild(nome);
  form.appendChild(preco);
  form.appendChild(el("label", { class: "sb-check" }, [ativo, el("span", { html: "Ativo" })]));
  form.appendChild(btn);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const precoNum = moneyToNumber(preco.value);
    if (Number.isNaN(precoNum)) {
      showToast("Preço inválido", "err");
      return;
    }

    try {
      const res = await apiFetch("/adicionais", {
        method: "POST",
        body: JSON.stringify({
          nome: nome.value.trim(),
          preco: precoNum,
          ativo: !!ativo.checked,
        }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        showToast(msg.message || "Erro ao adicionar adicional", "err");
        return;
      }

      showToast("Adicional adicionado!", "ok");
      form.reset();
      ativo.checked = true;
      await carregarAdicionaisUI();
    } catch (err) {
      console.error(err);
      showToast("Erro ao adicionar adicional", "err");
    }
  });

  mount.appendChild(form);
}

function renderAdicionaisList(adicionais) {
  const mount = document.getElementById("sb-adicionais-list");
  if (!mount) return;

  mount.innerHTML = "";

  if (!adicionais.length) {
    mount.appendChild(
      el("div", { class: "sb-empty", html: "Nenhum adicional cadastrado." })
    );
    return;
  }

  const table = el("table", { class: "sb-table" });
  table.appendChild(
    el("thead", {}, [
      el("tr", {}, [
        el("th", { html: "Nome" }),
        el("th", { html: "Preço" }),
        el("th", { html: "Ativo" }),
        el("th", { html: "Ações" }),
      ]),
    ])
  );

  const tbody = el("tbody");

  for (const ad of adicionais) {
    const inNome = el("input", { class: "sb-input sb-input-sm", value: ad.nome || "" });
    const inPreco = el("input", {
      class: "sb-input sb-input-sm",
      value: Number(ad.preco ?? 0).toFixed(2),
      inputmode: "decimal",
    });
    const ckAtivo = el("input", { type: "checkbox" });
    ckAtivo.checked = ad.ativo !== false;

    const btnSalvar = el("button", {
      class: "sb-btn sb-btn-primary sb-btn-sm",
      type: "button",
      html: "Salvar",
    });

    const btnExcluir = el("button", {
      class: "sb-btn sb-btn-danger sb-btn-sm",
      type: "button",
      html: "Excluir",
    });

    btnSalvar.addEventListener("click", async () => {
      const precoNum = moneyToNumber(inPreco.value);
      if (Number.isNaN(precoNum)) {
        showToast("Preço inválido", "err");
        return;
      }

      try {
        const res = await apiFetch(`/adicionais/${ad.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nome: inNome.value.trim(),
            preco: precoNum,
            ativo: !!ckAtivo.checked,
          }),
        });

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          showToast(msg.message || "Erro ao salvar adicional", "err");
          return;
        }

        showToast("Adicional salvo!", "ok");
        await carregarAdicionaisUI();
      } catch (err) {
        console.error(err);
        showToast("Erro ao salvar adicional", "err");
      }
    });

    btnExcluir.addEventListener("click", async () => {
      if (!confirmDanger(`Excluir adicional "${ad.nome}"?`)) return;

      try {
        const res = await apiFetch(`/adicionais/${ad.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          showToast(msg.message || "Erro ao excluir adicional", "err");
          return;
        }

        showToast("Adicional excluído!", "ok");
        await carregarAdicionaisUI();
      } catch (err) {
        console.error(err);
        showToast("Erro ao excluir adicional", "err");
      }
    });

    const tr = el("tr", {}, [
      el("td", {}, [inNome]),
      el("td", {}, [inPreco]),
      el("td", {}, [
        el("label", { class: "sb-check" }, [ckAtivo, el("span", { html: ckAtivo.checked ? "Sim" : "Não" })]),
      ]),
      el("td", {}, [el("div", { class: "sb-actions" }, [btnSalvar, btnExcluir])]),
    ]);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  mount.appendChild(table);
}

async function carregarAdicionaisUI() {
  const mount = document.getElementById("sb-adicionais-list");
  if (mount) mount.innerHTML = `<div class="sb-loading">Carregando adicionais...</div>`;

  try {
    adicionaisCache = await listarAdicionais();
    // Aqui você decide: mostrar todos ou só ativos
    // Para painel, é melhor mostrar TODOS:
    renderAdicionaisList(adicionaisCache);
  } catch (err) {
    console.error(err);
    if (mount) mount.innerHTML = `<div class="sb-empty">Erro ao carregar adicionais.</div>`;
    showToast("Erro ao carregar adicionais", "err");
  }
}

// ----------------------------
// CSS (melhora a “estilização horrível”)
// ----------------------------
function injectBetterCss() {
  if (document.getElementById("sb-admin-css")) return;

  const css = `
  .sb-root { margin-top: 18px; display: grid; gap: 16px; }
  .sb-card { background:#0b0b0b33; border:1px solid #ffffff1a; border-radius:12px; padding:16px; }
  .sb-card-header { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
  .sb-title { margin:0; font-size:18px; font-weight:800; }
  .sb-muted { margin:6px 0 12px; opacity:.85; font-size:13px; }
  .sb-divider { height:1px; background:#ffffff1a; margin:14px 0; }
  .sb-grid { display:grid; grid-template-columns: 1fr 220px; gap:10px; }
  .sb-form { display:flex; flex-direction:column; gap:10px; }
  .sb-form-inline { display:flex; flex-direction:row; align-items:center; gap:10px; flex-wrap:wrap; }
  .sb-label { display:block; font-size:12px; opacity:.85; margin-bottom:4px; }
  .sb-input, .sb-textarea {
    width:100%;
    background:#0f0f0f;
    border:1px solid #ffffff26;
    color:#fff;
    border-radius:10px;
    padding:10px 12px;
    outline:none;
  }
  .sb-input:focus, .sb-textarea:focus { border-color:#ff5722; box-shadow: 0 0 0 3px #ff572233; }
  .sb-textarea { min-height: 70px; resize: vertical; }
  .sb-input-sm { padding:8px 10px; border-radius:9px; }
  .sb-inline { display:flex; gap:14px; align-items:center; justify-content:flex-end; flex-wrap:wrap; }
  .sb-check { display:flex; gap:8px; align-items:center; font-size:13px; opacity:.95; }
  .sb-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

  .sb-btn {
    border:none;
    border-radius:10px;
    padding:10px 12px;
    cursor:pointer;
    font-weight:800;
  }
  .sb-btn-sm { padding:8px 10px; border-radius:9px; font-size:13px; }
  .sb-btn-primary { background:#22c55e; color:#07130b; }
  .sb-btn-danger { background:#ef4444; color:#160606; }
  .sb-btn-secondary { background:#ffffff1a; color:#fff; border:1px solid #ffffff26; }
  .sb-btn:hover { filter: brightness(1.05); }

  .sb-table { width:100%; border-collapse:separate; border-spacing:0; overflow:hidden; border-radius:12px; border:1px solid #ffffff26; background:#0f0f0f; }
  .sb-table th, .sb-table td { padding:10px; border-bottom:1px solid #ffffff14; vertical-align:top; }
  .sb-table th { text-align:left; font-size:12px; letter-spacing:.3px; text-transform:uppercase; opacity:.85; background:#121212; }
  .sb-table tr:last-child td { border-bottom:none; }

  .sb-thumb { width:54px; height:54px; object-fit:cover; border-radius:10px; border:1px solid #ffffff26; background:#111; }
  .sb-stack { display:flex; flex-direction:column; gap:8px; }
  .sb-small { font-size:12px; }

  .sb-loading, .sb-empty {
    padding:12px;
    border:1px dashed #ffffff26;
    border-radius:12px;
    opacity:.9;
  }

  .sb-toast-wrap { position:fixed; right:14px; bottom:14px; display:flex; flex-direction:column; gap:10px; z-index:9999; }
  .sb-toast {
    opacity:0;
    transform: translateY(10px);
    transition: all .2s ease;
    padding:10px 12px;
    border-radius:12px;
    font-weight:800;
    border:1px solid #ffffff26;
    background:#111;
    color:#fff;
    max-width: 320px;
  }
  .sb-toast.show { opacity:1; transform: translateY(0); }
  .sb-toast.ok { border-color:#22c55e55; }
  .sb-toast.err { border-color:#ef444455; }
  `;

  const style = document.createElement("style");
  style.id = "sb-admin-css";
  style.textContent = css;
  document.head.appendChild(style);
}

// ----------------------------
// INIT
// ----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  if (!exigirLogin()) return;

  injectBetterCss();
  configurarLogout();
  await carregarAdmin();

  // status loja (se existir no HTML)
  await carregarStatusLoja();

  const btnAbrir = document.getElementById("btn-abrir");
  const btnFechar = document.getElementById("btn-fechar");
  if (btnAbrir) btnAbrir.addEventListener("click", () => alterarStatus(true));
  if (btnFechar) btnFechar.addEventListener("click", () => alterarStatus(false));

  // monta painel completo
  ensurePanelStructure();
  renderFormNovoItem();
  renderFormNovoAdicional();

  await carregarItensUI();
  await carregarAdicionaisUI();
});
