document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Segurança real: valida a sessão no servidor (cookie + express-session)
  const API_BASE = "";

  const apiFetch = (url, options = {}) => {
    return fetch(`${API_BASE}${url}`, {
      credentials: "include",
      ...options,
    });
  };

  try {
    const authResp = await apiFetch("/auth/check");
    if (!authResp.ok) {
      window.location.href = "/login";
      return;
    }
  } catch (err) {
    window.location.href = "/login";
    return;
  }

  // --- 1. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
  const btnMostrarGerenciar = document.getElementById("btn-mostrar-gerenciar");
  const btnMostrarPedidos = document.getElementById("btn-mostrar-pedidos");
  const sectionGerenciar = document.getElementById("section-gerenciar");
  const sectionPedidos = document.getElementById("section-pedidos");

  // Botões do gerenciamento
  const btnAdicionarHamburguer = document.getElementById("btn-adicionar-hamburguer");
  const btnListarHamburguers = document.getElementById("btn-listar-hamburguers");
  const btnGerenciarAdicionais = document.getElementById("btn-gerenciar-adicionais");
  const btnGerenciarCategorias = document.getElementById("btn-gerenciar-categorias");

  // Contêiner principal de conteúdo
  const conteudo = document.getElementById("conteudo");

  // Botão de logout
  const btnLogout = document.getElementById("btn-logout");

  // Loja (status)
  const btnStatusLoja = document.getElementById("btn-status-loja");
  const statusTexto = document.getElementById("status-texto");

  // --- 2. EVENTOS DE NAVEGAÇÃO (ABAS) ---
  btnMostrarGerenciar.addEventListener("click", () => {
    sectionGerenciar.style.display = "block";
    sectionPedidos.style.display = "none";
  });

  btnMostrarPedidos.addEventListener("click", () => {
    sectionGerenciar.style.display = "none";
    sectionPedidos.style.display = "block";
    carregarPedidos();
  });

  // --- 3. EVENTOS DOS BOTÕES DE GERENCIAMENTO ---
  btnAdicionarHamburguer.addEventListener("click", mostrarFormularioAdicionar);
  btnListarHamburguers.addEventListener("click", listarHamburguers);
  btnGerenciarAdicionais.addEventListener("click", mostrarGerenciarAdicionais);
  btnGerenciarCategorias.addEventListener("click", mostrarGerenciarCategorias);

  // --- 4. LOGOUT ---
  btnLogout.addEventListener("click", fazerLogout);

  async function fazerLogout() {
    try {
      await fetch("/logout", { method: "POST", credentials: "include" });
    } catch (_) {}
    window.location.href = "/admin";
  }

  // --- 5. STATUS LOJA ---
  btnStatusLoja.addEventListener("click", alternarStatusLoja);

  async function verificarStatusLoja() {
    try {
      const response = await fetch(`${API_BASE}/status-loja`);
      const data = await response.json();
      statusTexto.textContent = data.lojaAberta ? "ABERTA" : "FECHADA";
    } catch (error) {
      console.error("Erro ao verificar status da loja:", error);
    }
  }

  async function alternarStatusLoja() {
    try {
      const responseAtual = await fetch(`${API_BASE}/status-loja`);
      const dataAtual = await responseAtual.json();
      const novoStatus = !dataAtual.lojaAberta;

      const response = await fetch(`${API_BASE}/alterar-status-loja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lojaAberta: novoStatus }),
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error("Falha ao alterar status:", txt);
        alert("Não foi possível alterar o status da loja.");
        return;
      }

      await verificarStatusLoja();
    } catch (error) {
      console.error("Erro ao alternar status da loja:", error);
      alert("Erro ao alternar status da loja.");
    }
  }

  // Verifica status ao abrir painel
  verificarStatusLoja();

  // ============================
  // A PARTIR DAQUI: SEU CÓDIGO ORIGINAL (SEM MUDAR A LÓGICA)
  // ============================

  // --- Helpers / Estado ---
  const categoriasFixas = ["combo", "hamburguer", "adicional", "bebida", "sobremesa"];

  // --- 6. FORMULÁRIO PARA ADICIONAR ITEM ---
  async function mostrarFormularioAdicionar() {
    conteudo.innerHTML = `
      <h2>Adicionar Item</h2>
      <form id="formAdicionar" enctype="multipart/form-data">
        <label>Nome:</label>
        <input type="text" name="nome" required />

        <label>Descrição:</label>
        <textarea name="descricao" required></textarea>

        <label>Preço:</label>
        <input type="number" step="0.01" name="preco" required />

        <label>Categoria(s):</label>
        <div id="categorias-container"></div>

        <label>Indisponível?</label>
        <input type="checkbox" name="indisponivel" />

        <label>Novo Item?</label>
        <input type="checkbox" name="novoItem" />

        <label>Imagem:</label>
        <input type="file" name="imagem" accept="image/*" />

        <button type="submit">Salvar</button>
      </form>
    `;

    await carregarCategoriasNoFormulario();

    document.getElementById("formAdicionar").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      // Coleta categorias marcadas
      const checks = [...document.querySelectorAll('input[name="categoriaCheckbox"]:checked')];
      const categoriasSelecionadas = checks.map((c) => c.value);
      formData.append("categoria", JSON.stringify(categoriasSelecionadas));

      try {
        const resp = await fetch(`${API_BASE}/adicionar/hamburguers`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!resp.ok) {
          const txt = await resp.text();
          console.error(txt);
          alert("Erro ao adicionar item!");
          return;
        }

        alert("Item adicionado com sucesso!");
        listarHamburguers();
      } catch (err) {
        console.error(err);
        alert("Erro ao conectar com o servidor.");
      }
    });
  }

  function criarCheckboxCategoria(valor, label) {
    const container = document.getElementById("categorias-container");
    if (!container) return;

    const id = `cat-${valor}`.replace(/\s+/g, "-");
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "categoriaCheckbox";
    input.value = valor;
    input.id = id;

    const lab = document.createElement("label");
    lab.htmlFor = id;
    lab.textContent = label;

    wrapper.appendChild(input);
    wrapper.appendChild(lab);
    container.appendChild(wrapper);
  }

  async function carregarCategoriasNoFormulario() {
    const container = document.getElementById("categorias-container");
    if (!container) return;

    container.innerHTML = "";

    // categorias fixas
    categoriasFixas.forEach((cat) => criarCheckboxCategoria(cat, cat));

    // categorias custom do banco
    try {
      const resp = await fetch(`${API_BASE}/categorias`);
      const cats = await resp.json();
      if (Array.isArray(cats)) {
        cats.forEach((c) => {
          if (c && c.valor && c.label) criarCheckboxCategoria(c.valor, c.label);
        });
      }
    } catch (e) {
      console.error("Erro ao carregar categorias:", e);
    }
  }

  // --- 7. LISTAR ITENS ---
  async function listarHamburguers() {
    conteudo.innerHTML = `<h2>Itens cadastrados</h2><div id="lista-itens"></div>`;
    const lista = document.getElementById("lista-itens");

    try {
      const resp = await fetch(`${API_BASE}/buscar/hamburguers`);
      const itens = await resp.json();

      if (!Array.isArray(itens) || itens.length === 0) {
        lista.innerHTML = "<p>Nenhum item encontrado.</p>";
        return;
      }

      itens.forEach((item) => {
        const card = document.createElement("div");
        card.className = "card-item";
        card.innerHTML = `
          <h3>${item.nome}</h3>
          <p>${item.descricao}</p>
          <p><strong>Preço:</strong> R$ ${Number(item.preco).toFixed(2)}</p>
          <p><strong>Categorias:</strong> ${(item.categoria || []).join(", ")}</p>
          <p><strong>Indisponível:</strong> ${item.indisponivel ? "Sim" : "Não"}</p>
          <p><strong>Novo:</strong> ${item.novoItem ? "Sim" : "Não"}</p>
          ${
            item.imagem_url
              ? `<img src="${item.imagem_url}" alt="${item.nome}" style="max-width:120px;border-radius:8px" />`
              : ""
          }
          <div class="acoes">
            <button class="btn-editar">Editar</button>
            <button class="btn-deletar">Deletar</button>
          </div>
        `;

        card.querySelector(".btn-editar").addEventListener("click", () => {
          mostrarFormularioEditar(item.id);
        });

        card.querySelector(".btn-deletar").addEventListener("click", () => {
          deletarItem(item.id);
        });

        lista.appendChild(card);
      });
    } catch (e) {
      console.error(e);
      lista.innerHTML = "<p>Erro ao buscar itens.</p>";
    }
  }

  async function deletarItem(id) {
    if (!confirm("Tem certeza que deseja deletar este item?")) return;

    try {
      const resp = await fetch(`${API_BASE}/deletar/hamburguer/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error(txt);
        alert("Erro ao deletar item!");
        return;
      }

      alert("Item deletado com sucesso!");
      listarHamburguers();
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar com o servidor.");
    }
  }

  // --- 8. EDITAR ITEM ---
  async function mostrarFormularioEditar(id) {
    try {
      const resp = await fetch(`${API_BASE}/buscar/hamburguer/${id}`);
      const item = await resp.json();

      conteudo.innerHTML = `
        <h2>Editar Item</h2>
        <form id="formEditar" enctype="multipart/form-data">
          <label>Nome:</label>
          <input type="text" name="nome" required value="${item.nome || ""}" />

          <label>Descrição:</label>
          <textarea name="descricao" required>${item.descricao || ""}</textarea>

          <label>Preço:</label>
          <input type="number" step="0.01" name="preco" required value="${item.preco || 0}" />

          <label>Categoria(s):</label>
          <div id="categorias-container"></div>

          <label>Indisponível?</label>
          <input type="checkbox" name="indisponivel" ${item.indisponivel ? "checked" : ""} />

          <label>Novo Item?</label>
          <input type="checkbox" name="novoItem" ${item.novoItem ? "checked" : ""} />

          <label>Imagem (opcional):</label>
          <input type="file" name="imagem" accept="image/*" />

          <button type="submit">Salvar alterações</button>
        </form>
      `;

      await carregarCategoriasNoFormulario();
      marcarCategoriasDoItem(item.categoria || []);

      document.getElementById("formEditar").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const checks = [...document.querySelectorAll('input[name="categoriaCheckbox"]:checked')];
        const categoriasSelecionadas = checks.map((c) => c.value);
        formData.append("categoria", JSON.stringify(categoriasSelecionadas));

        try {
          const resp2 = await fetch(`${API_BASE}/editar/hamburguer/${id}`, {
            method: "PUT",
            credentials: "include",
            body: formData,
          });

          if (!resp2.ok) {
            const txt = await resp2.text();
            console.error(txt);
            alert("Erro ao editar item!");
            return;
          }

          alert("Item atualizado com sucesso!");
          listarHamburguers();
        } catch (err) {
          console.error(err);
          alert("Erro ao conectar com o servidor.");
        }
      });
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar item.");
    }
  }

  function marcarCategoriasDoItem(categorias = []) {
    categorias.forEach((cat) => {
      const input = document.querySelector(`input[name="categoriaCheckbox"][value="${cat}"]`);
      if (input) input.checked = true;
    });
  }

  // --- 9. GERENCIAR ADICIONAIS ---
  async function mostrarGerenciarAdicionais() {
    conteudo.innerHTML = `
      <h2>Gerenciar Adicionais</h2>
      <div id="adicionais-lista"></div>
      <h3>Novo adicional</h3>
      <form id="formAddAdicional">
        <label>Nome</label>
        <input type="text" id="adicionalNome" required />
        <label>Preço</label>
        <input type="number" step="0.01" id="adicionalPreco" required />
        <button type="submit">Adicionar</button>
      </form>
    `;

    const lista = document.getElementById("adicionais-lista");

    async function carregar() {
      lista.innerHTML = "Carregando...";
      const r = await fetch(`${API_BASE}/adicionais`);
      const adicionais = await r.json();

      if (!Array.isArray(adicionais) || adicionais.length === 0) {
        lista.innerHTML = "<p>Nenhum adicional cadastrado.</p>";
        return;
      }

      lista.innerHTML = "";
      adicionais.forEach((a) => {
        const div = document.createElement("div");
        div.className = "card-item";
        div.innerHTML = `
          <strong>${a.nome}</strong> - R$ ${Number(a.preco).toFixed(2)}
          <button class="btn-deletar">Excluir</button>
        `;
        div.querySelector(".btn-deletar").addEventListener("click", async () => {
          if (!confirm("Excluir adicional?")) return;
          const del = await fetch(`${API_BASE}/adicionais/${a.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!del.ok) return alert("Falha ao excluir adicional.");
          carregar();
        });
        lista.appendChild(div);
      });
    }

    await carregar();

    document.getElementById("formAddAdicional").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("adicionalNome").value.trim();
      const preco = document.getElementById("adicionalPreco").value;

      const r = await fetch(`${API_BASE}/adicionais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nome, preco }),
      });

      if (!r.ok) return alert("Falha ao criar adicional.");
      e.target.reset();
      carregar();
    });
  }

  // --- 10. GERENCIAR CATEGORIAS ---
  async function mostrarGerenciarCategorias() {
    conteudo.innerHTML = `
      <h2>Gerenciar Categorias</h2>
      <div id="categorias-lista"></div>
      <h3>Nova categoria</h3>
      <form id="formAddCategoria">
        <label>Valor (id)</label>
        <input type="text" id="catValor" required />
        <label>Label (nome)</label>
        <input type="text" id="catLabel" required />
        <button type="submit">Adicionar</button>
      </form>
    `;

    const lista = document.getElementById("categorias-lista");

    async function carregar() {
      lista.innerHTML = "Carregando...";
      const r = await fetch(`${API_BASE}/categorias`);
      const cats = await r.json();

      if (!Array.isArray(cats) || cats.length === 0) {
        lista.innerHTML = "<p>Nenhuma categoria cadastrada.</p>";
        return;
      }

      lista.innerHTML = "";
      cats.forEach((c) => {
        const div = document.createElement("div");
        div.className = "card-item";
        div.innerHTML = `
          <strong>${c.label}</strong> (${c.valor})
          <button class="btn-deletar">Excluir</button>
        `;

        div.querySelector(".btn-deletar").addEventListener("click", async () => {
          if (!confirm("Excluir categoria?")) return;
          const del = await fetch(`${API_BASE}/categorias/${c.valor}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!del.ok) return alert("Falha ao excluir categoria.");
          carregar();
        });

        lista.appendChild(div);
      });
    }

    await carregar();

    document.getElementById("formAddCategoria").addEventListener("submit", async (e) => {
      e.preventDefault();
      const valor = document.getElementById("catValor").value.trim();
      const label = document.getElementById("catLabel").value.trim();

      const r = await fetch(`${API_BASE}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ valor, label }),
      });

      if (!r.ok) return alert("Falha ao criar categoria.");
      e.target.reset();
      carregar();
    });
  }

  // --- 11. PEDIDOS (se existir no seu projeto original) ---
  async function carregarPedidos() {
    // Se você já tem endpoints de pedidos em outro arquivo/rota,
    // mantenha aqui sua lógica original. (Não alterei essa parte.)
  }
});
