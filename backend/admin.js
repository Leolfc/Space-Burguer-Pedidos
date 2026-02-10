document.addEventListener("DOMContentLoaded", async () => {
  // **Verificação de segurança inicial - validar sessão no servidor**
  try {
    const resp = await fetch("/check-auth", { credentials: "include" });
    if (!resp.ok) {
      // Sessão inválida no servidor, redireciona para login
      window.location.href = "/login";
      return;
    }
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    window.location.href = "/login";
    return;
  }

  const API_BASE = "";

  // --- 1. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
  const btnMostrarGerenciar = document.getElementById("btn-mostrar-gerenciar");
  const btnMostrarAdicionar = document.getElementById("btn-mostrar-adicionar");
  const btnMostrarAdicionais = document.getElementById("btn-mostrar-adicionais");
  const btnAbrirAdicionar = document.getElementById("btn-abrir-adicionar");
  const btnLogout = document.getElementById("btn-logout");
  const telaGerenciar = document.getElementById("tela-gerenciar");
  const telaAdicionar = document.getElementById("tela-adicionar");
  const telaAdicionais = document.getElementById("tela-adicionais");
  const formAdicionar = document.getElementById("form-adicionar-lanche");
  const tituloForm = document.getElementById("titulo-form");
  const btnSubmit = document.getElementById("btn-submit");
  const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");
  const inputFiltro = document.getElementById("filtro-lanches");
  const tabelaCorpo = document.getElementById("tabela-lanches-corpo");
  const statusTexto = document.getElementById("status-atual-texto");
  const btnAbrirLoja = document.getElementById("btn-abrir-loja");
  const btnFecharLoja = document.getElementById("btn-fechar-loja");
  const tabelaAdicionais = document.getElementById("tabela-adicionais-corpo");
  const formAdicional = document.getElementById("form-adicional");
  const tituloFormAdicional = document.getElementById("titulo-form-adicional");
  const btnCancelarAdicional = document.getElementById(
    "btn-cancelar-adicional"
  );
  const btnNovoAdicional = document.getElementById("btn-novo-adicional");
  const listaCategorias = document.getElementById("lista-categorias");
  const inputNovaCategoria = document.getElementById("nova-categoria");
  const btnAddCategoria = document.getElementById("btn-add-categoria");
   const btnRemoveCategoria = document.getElementById("btn-remove-categoria");
  let idEmEdicao = null;
  let adicionalEmEdicao = null;

  const STORAGE_CATEGORIAS = "categoriasExtras";
  const categoriasFixas = ["space", "smash", "combo", "porcoes", "bebidas"];
  
  // --- 2. FUNÇÕES ---

  // Cria um slug seguro para usar como value do checkbox
  function slugCategoria(nome) {
    return nome
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || nome.toLowerCase().trim();
  }

  // Cria o checkbox no DOM se não existir
  function criarCheckboxCategoria(valor, label) {
    if (!listaCategorias) return;
    const existe = listaCategorias.querySelector(
      `input[name="categoria"][value="${valor}"]`
    );
    if (existe) return;

    const div = document.createElement("div");
    div.className = "category-option";
    div.innerHTML = `
      <input type="checkbox" name="categoria" value="${valor}" />
      <label>${label}</label>
    `;
    listaCategorias.appendChild(div);
  }

  function salvarCategoriasExtras(extras) {
    localStorage.setItem(STORAGE_CATEGORIAS, JSON.stringify(extras));
  }
  async function carregarCategoriasExtras() {
    // tenta buscar no servidor primeiro
    try {
      const resp = await fetch(`${API_BASE}/categorias?t=${Date.now()}`);
      if (resp.ok) {
        const data = await resp.json();
        // salva em localStorage como cache
        salvarCategoriasExtras(data.map((c) => ({ valor: c.valor, label: c.label })));
        data.forEach((cat) => {
          criarCheckboxCategoria(cat.valor, cat.label);
        });
        return;
      }
    } catch (error) {
      // falha ao buscar no servidor, cai para o cache local
    }

    // fallback: usar localStorage
    try {
      const extras = JSON.parse(localStorage.getItem(STORAGE_CATEGORIAS)) || [];
      extras.forEach((cat) => {
        if (!cat) return;
        if (typeof cat === "object") {
          const valor = cat.valor || slugCategoria(String(cat.label || ""));
          const label = cat.label || valor;
          criarCheckboxCategoria(valor, label);
        } else if (typeof cat === "string") {
          const valor = slugCategoria(cat);
          criarCheckboxCategoria(valor, cat);
        }
      });
    } catch (_) {}
  }

  async function removerCategoriaPorValor(valor) {
    if (!valor) return false;
    // Não permite remover categorias fixas
    if (categoriasFixas.includes(valor)) {
      alert("Não é possível remover uma categoria fixa.");
      return false;
    }

    try {
      const resp = await fetch(`${API_BASE}/categorias/${encodeURIComponent(valor)}`, { method: "DELETE" });
      if (!resp.ok) {
        return false;
      }
      // remove do DOM se presente
      const input = listaCategorias.querySelector(`input[name="categoria"][value="${valor}"]`);
      const wrapper = input ? input.closest(".category-option") : null;
      if (wrapper) wrapper.remove();

      // Atualiza localStorage removendo a categoria
      const extras = JSON.parse(localStorage.getItem(STORAGE_CATEGORIAS)) || [];
      const novos = extras.filter((e) => {
        const v = e && typeof e === "object" ? e.valor : slugCategoria(String(e || ""));
        return v !== valor;
      });
      salvarCategoriasExtras(novos);
      return true;
    } catch (error) {
      console.error("Erro ao remover categoria:", error);
      return false;
    }
  }

  async function adicionarCategoriaExtra(nome) {
    const label = nome.trim();
    if (!label) {
      alert("Informe um nome para a categoria.");
      return;
    }
    const valor = slugCategoria(label);

    // evita duplicados
    if (listaCategorias.querySelector(`input[value="${valor}"]`)) {
      alert("Essa categoria já existe.");
      return;
    }

    // cria no servidor
    try {
      const resp = await fetch(`${API_BASE}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor, label }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao salvar categoria");
      }
      const novo = await resp.json();
      criarCheckboxCategoria(novo.valor, novo.label);
      // atualiza cache local
      const extras = JSON.parse(localStorage.getItem(STORAGE_CATEGORIAS)) || [];
      extras.push({ valor: novo.valor, label: novo.label });
      salvarCategoriasExtras(extras);
    } catch (error) {
      alert(`Erro ao salvar categoria: ${error.message}`);
      return;
    }

    // limpa e foca
    if (inputNovaCategoria) {
      inputNovaCategoria.value = "";
      inputNovaCategoria.focus();
    }
  }

  // Garante que categorias de um lanche sejam exibidas nos checkboxes
  function garantirCategoriasDoLanche(categorias = []) {
    categorias.forEach((cat) => {
      if (categoriasFixas.includes(cat)) return;
      criarCheckboxCategoria(cat, cat);
    });
  }


  function fazerLogout() {
    // Tenta encerrar a sessão no servidor e, em seguida, redireciona
    try {
      fetch("/logout", { method: "POST", credentials: "include" }).catch(() => {});
    } catch (_) {}

    sessionStorage.removeItem("isLoggedIn");
    // usar rota absoluta para evitar navegar para /painel/login
    window.location.href = "/login";
  }

  async function verificarStatusLoja() {
    try {
      const response = await fetch(`${API_BASE}/status-loja`);
      const data = await response.json();
      statusTexto.textContent = data.lojaAberta ? "ABERTA" : "FECHADA";
      statusTexto.style.color = data.lojaAberta ? "green" : "red";
    } catch (error) {
      statusTexto.textContent = "Erro ao carregar";
    }
  }

  async function alterarStatusLoja(novoStatus) {
    try {
      const response = await fetch(`${API_BASE}/alterar-status-loja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lojaAberta: novoStatus }),
      });
      if (response.ok) {
        alert(`Loja ${novoStatus ? "aberta" : "fechada"} com sucesso!`);
        verificarStatusLoja();
      } else {
        throw new Error("Falha ao alterar status");
      }
    } catch (error) {
      alert("Ocorreu um erro.");
    }
  }

  function mostrarTela(idTelaParaMostrar) {
    telaGerenciar.style.display = "none";
    telaAdicionar.style.display = "none";
    telaAdicionais.style.display = "none";
    btnMostrarGerenciar.classList.remove("active");
    btnMostrarAdicionar.classList.remove("active");
    btnMostrarAdicionais.classList.remove("active");

    if (idTelaParaMostrar === "tela-gerenciar") {
      telaGerenciar.style.display = "block";
      btnMostrarGerenciar.classList.add("active");
    } else if (idTelaParaMostrar === "tela-adicionar") {
      telaAdicionar.style.display = "block";
      btnMostrarAdicionar.classList.add("active");
    } else if (idTelaParaMostrar === "tela-adicionais") {
      telaAdicionais.style.display = "block";
      btnMostrarAdicionais.classList.add("active");
    }
  }

  async function carregarLanches() {
    
    try {
      const response = await fetch(
        `${API_BASE}/buscar/hamburguers?t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Falha ao buscar lanches.");

      const lanches = await response.json();
      // Limpa container
      tabelaCorpo.innerHTML = "";

      const grupos = {
        space: { label: "Space Burguer", aliases: ["space"] },
        smash: { label: "Smash Burguer", aliases: ["smash"] },
        combo: { label: "Combo", aliases: ["combo"] },
        bebidas: { label: "Bebidas", aliases: ["bebidas"] },
        porcoes: { label: "Porções", aliases: ["porcoes"] },
      };

      // Ler categorias extras salvas e acrescentar como grupos
      const extrasSalvas = JSON.parse(localStorage.getItem(STORAGE_CATEGORIAS)) || [];
      extrasSalvas.forEach((cat) => {
        if (!cat) return;
        const valor = typeof cat === "object" ? cat.valor : slugCategoria(String(cat));
        const label = typeof cat === "object" ? cat.label : String(cat);
        if (!valor || grupos[valor]) return; // evita sobrepor grupos fixos
        grupos[valor] = { label, aliases: [valor] };
      });

      // Criar seções (tabela) para cada grupo e uma seção "Outros"
      const sectionTbodyMap = {};
      Object.keys(grupos).forEach((key) => {
        const section = document.createElement("section");
        section.className = "categoria-section";
        section.innerHTML = `
        <div class="container-category">
          <button class="btn-toggle-categoria" data-categoria="${key}" type="button">
            <img class="setaCima" src="../img/icons/setaCima.png" alt="Toggle categoria">
          </button>
          <h3>${grupos[key].label}</h3>
        </div>
          
          <table class="tabela-categoria" data-tabela-categoria="${key}" style="display: none;">
            <thead>
              <tr><th>Imagem</th><th>Nome</th><th>Preço</th><th>Categorias</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody data-categoria="${key}"></tbody>
          </table>
        `;
        tabelaCorpo.appendChild(section);
        sectionTbodyMap[key] = section.querySelector('tbody');
       
      });

      // Garante seção 'outros' para itens sem categoria conhecida
      
    

      
      function criarLinha(lanche) {
        const tr = document.createElement("tr");
        const precoFormatado = `R$ ${parseFloat(lanche.preco)
          .toFixed(2)
          .replace(".", ",")}`;
        const categoriasTexto = Array.isArray(lanche.categoria)
          ? lanche.categoria.join(", ")
          : "";
        const imgSrc = lanche.imagem_url
          ? lanche.imagem_url.startsWith("/uploads") ||
            lanche.imagem_url.startsWith("/img")
            ? `${API_BASE}${lanche.imagem_url}`
            : lanche.imagem_url
          : "";
        const statusHtml = `
                    ${
                      lanche.novoItem
                        ? '<span class="badge badge-novo">Novo</span>'
                        : ""
                    }
                    ${
                      lanche.indisponivel
                        ? '<span class="badge badge-indisponivel">Indisponível</span>'
                        : '<span class="badge">Ativo</span>'
                    }
                `;

        tr.innerHTML = `
                    <td>${
                      imgSrc
                        ? `<img src="${imgSrc}" alt="${lanche.nome}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;"/>`
                        : ""
                    }</td>
                    <td>${lanche.nome}</td>
                    <td>${precoFormatado}</td>
                    <td>${categoriasTexto}</td>
                    <td>${statusHtml}</td>
                    <td class="acoes">
                        <button class="btn-editar" data-id="${
                          lanche.id
                        }">Editar</button>
                        <button class="btn-deletar" data-id="${
                          lanche.id
                        }">Deletar</button>
                    </td>
                `;

        return tr;
      }

      // Distribuir lanches entre as seções com base nas categorias
      lanches.forEach((lanche) => {
        const categorias = Array.isArray(lanche.categoria)
          ? lanche.categoria
          : [];
        let colocado = false;

        // Verifica cada grupo definido em `grupos` e usa as aliases para decidir
        Object.keys(grupos).forEach((key) => {
          const aliases = grupos[key].aliases || [];
          const pertence = aliases.some((alias) => categorias.includes(alias));
          if (pertence) {
            const tr = criarLinha(lanche);
            sectionTbodyMap[key].appendChild(tr);
            colocado = true;
          }
        });

        // Se não foi colocado em nenhuma seção específica, joga em 'outros'
        if (!colocado) {
          const tr = criarLinha(lanche);
          sectionTbodyMap.outros.appendChild(tr);
        }
      });

      
      Object.keys(sectionTbodyMap).forEach((key) => {
        const tbody = sectionTbodyMap[key];
        if (!tbody.querySelector("tr")) {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td colspan="6" style="opacity:0.7">Nenhum item nesta categoria.</td>`;
          tbody.appendChild(tr);
        }
      });

      // Adicionar funcionalidade de toggle para esconder/mostrar categorias
      document.querySelectorAll(".btn-toggle-categoria").forEach((btn) => {
        btn.addEventListener("click", function() {
          const categoriaKey = this.dataset.categoria;
          const tabela = document.querySelector(
            `table[data-tabela-categoria="${categoriaKey}"]`
          );
          const imgSeta = this.querySelector(".setaCima");
          
          if (tabela) {
            // Alterna a visibilidade da tabela
            if (tabela.style.display === "none") {
              tabela.style.display = "table";
              // Rotaciona a seta para baixo quando abre
              if (imgSeta) {
                imgSeta.style.transform = "rotate(180deg)";
                imgSeta.style.transition = "transform 0.3s ease";
              }
            } else {
              tabela.style.display = "none";
              // Rotaciona a seta para cima quando fecha
              if (imgSeta) {
                imgSeta.style.transform = "rotate(0deg)";
                imgSeta.style.transition = "transform 0.3s ease";
              }
            }
          }
        });
      });
    } catch (error) {
      console.error("Erro ao carregar lanches:", error);
      tabelaCorpo.innerHTML =
        '<tr><td colspan="6">Erro ao carregar cardápio.</td></tr>';
    }
  }

  function entrarNoModoEdicao(lanche) {
    idEmEdicao = lanche.id;
    tituloForm.textContent = `Editar Lanche: ${lanche.nome}`;
    btnSubmit.textContent = "Salvar Alterações";
    btnCancelarEdicao.style.display = "inline-block";

    // garante que categorias existentes do item apareçam como checkboxes
    garantirCategoriasDoLanche(lanche.categoria || []);
    document.getElementById("nome").value = lanche.nome || "";
    document.getElementById("descricao").value = lanche.descricao || "";
    document.getElementById("preco").value =
      String(lanche.preco).replace(".", ",") || ""; // Converte ponto para vírgula
    document.getElementById("novoItem").checked = !!lanche.novoItem;
    document.getElementById("indisponivel").checked = !!lanche.indisponivel;
    document.getElementById("imagem_url").value = "";

    formAdicionar.querySelectorAll('input[name="categoria"]').forEach((cb) => {
      cb.checked =
        Array.isArray(lanche.categoria) && lanche.categoria.includes(cb.value);
    });

    mostrarTela("tela-adicionar");
  }

  function sairDoModoEdicao() {
    idEmEdicao = null;
    tituloForm.textContent = "Adicionar Novo Lanche";
    btnSubmit.textContent = "Adicionar Lanche ao Cardápio";
    btnCancelarEdicao.style.display = "none";
    if (formAdicionar) {
      formAdicionar.reset();
    }
  }

  function sairDoModoEdicaoAdicional() {
    adicionalEmEdicao = null;
    tituloFormAdicional.textContent = "Adicionar adicional";
    btnCancelarAdicional.style.display = "none";
    if (formAdicional) {
      formAdicional.reset();
    }
  }

  async function carregarAdicionais() {
    if (!tabelaAdicionais) return;
    try {
      const response = await fetch(`${API_BASE}/adicionais?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Falha ao buscar adicionais.");
      const adicionais = await response.json();
      tabelaAdicionais.innerHTML = "";

      if (!adicionais.length) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          '<td colspan="3" style="opacity:0.7">Nenhum adicional cadastrado.</td>';
        tabelaAdicionais.appendChild(tr);
        return;
      }

      adicionais.forEach((adicional) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${adicional.nome}</td>
          <td>R$ ${parseFloat(adicional.preco)
            .toFixed(2)
            .replace(".", ",")}</td>
          <td class="acoes">
            <button class="btn-editar" data-id="${adicional.id}">Editar</button>
            <button class="btn-deletar" data-id="${adicional.id}">Deletar</button>
          </td>
        `;
        tr.dataset.nome = adicional.nome;
        tr.dataset.preco = adicional.preco;
        tabelaAdicionais.appendChild(tr);
      });
    } catch (error) {
      console.error("Erro ao carregar adicionais:", error);
      tabelaAdicionais.innerHTML =
        '<tr><td colspan="3">Erro ao carregar adicionais.</td></tr>';
    }
  }

  btnLogout.addEventListener("click", fazerLogout);
  btnAbrirLoja.addEventListener("click", () => alterarStatusLoja(true));
  btnFecharLoja.addEventListener("click", () => alterarStatusLoja(false));

  btnMostrarGerenciar.addEventListener("click", () => {
    carregarLanches();
    mostrarTela("tela-gerenciar");
  });

  btnMostrarAdicionar.addEventListener("click", () => {
    sairDoModoEdicao();
    mostrarTela("tela-adicionar");
  });

  btnMostrarAdicionais.addEventListener("click", () => {
    sairDoModoEdicaoAdicional();
    carregarAdicionais();
    mostrarTela("tela-adicionais");
  });

  if (btnAbrirAdicionar) {
    btnAbrirAdicionar.addEventListener("click", () => {
      sairDoModoEdicao();
      mostrarTela("tela-adicionar");
    });
  }

  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", () => {
      sairDoModoEdicao();
      mostrarTela("tela-gerenciar");
    });
  }

  if (btnNovoAdicional) {
    btnNovoAdicional.addEventListener("click", () => {
      sairDoModoEdicaoAdicional();
    });
  }

  // Adicionar nova categoria dinamicamente
  if (btnAddCategoria) {
    btnAddCategoria.addEventListener("click", () => {
      if (!inputNovaCategoria) return;
      adicionarCategoriaExtra(inputNovaCategoria.value);
    });
  }

  if (btnRemoveCategoria) {
    btnRemoveCategoria.addEventListener("click", async () => {
      if (!listaCategorias) return;
      const nome = inputNovaCategoria ? inputNovaCategoria.value.trim() : "";
      if (nome) {
        const valor = slugCategoria(nome);
        if (!confirm(`Confirma remoção da categoria "${nome}"?`)) return;
        if (await removerCategoriaPorValor(valor)) {
          alert("Categoria removida.");
          inputNovaCategoria.value = "";
        } else {
          alert("Categoria não encontrada ou não pode ser removida.");
        }
        return;
      }

      // Se não informou nome, remove as categorias selecionadas (exceto fixas)
      const checked = Array.from(
        listaCategorias.querySelectorAll('input[name="categoria"]:checked')
      );
      if (checked.length === 0) {
        alert("Informe o nome da categoria ou selecione uma categoria para remover.");
        return;
      }
      if (!confirm(`Confirma remoção de ${checked.length} categoria(s)?`)) return;
      let removed = 0;
      for (const cb of checked) {
        const val = cb.value;
        if (categoriasFixas.includes(val)) continue;
        if (await removerCategoriaPorValor(val)) {
          removed++;
        }
      }
      alert(`${removed} categoria(s) removida(s).`);
    });
  }

  if (inputNovaCategoria) {
    inputNovaCategoria.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        adicionarCategoriaExtra(inputNovaCategoria.value);
      }
    });
  }

  if (btnCancelarAdicional) {
    btnCancelarAdicional.addEventListener("click", () => {
      sairDoModoEdicaoAdicional();
    });
  }

  if (formAdicionar) {
    formAdicionar.addEventListener("submit", async (event) => {
      event.preventDefault();

      const checkboxes = formAdicionar.querySelectorAll(
        'input[name="categoria"]:checked'
      );
      const categorias = Array.from(checkboxes).map((cb) => cb.value);

      if (categorias.length === 0) {
        alert("Por favor, selecione pelo menos uma categoria.");
        return;
      }

      const formData = new FormData();
      const precoValor = document
        .getElementById("preco")
        .value.replace(",", ".");

      formData.append("nome", document.getElementById("nome").value);
      formData.append("descricao", document.getElementById("descricao").value);
      formData.append("preco", precoValor);
      formData.append("categoria", JSON.stringify(categorias));
      formData.append("novoItem", document.getElementById("novoItem").checked);
      formData.append(
        "indisponivel",
        document.getElementById("indisponivel").checked
      );

      const arquivo = document.getElementById("imagem_url").files[0];
      if (arquivo) {
        formData.append("imagem", arquivo);
      }

      const url = idEmEdicao
        ? `${API_BASE}/editar/hamburguer/${idEmEdicao}`
        : `${API_BASE}/adicionar/hamburguers`;
      const method = idEmEdicao ? "PUT" : "POST";

      try {
        const response = await fetch(url, { method, body: formData });
        if (response.ok) {
          alert(
            `Lanche ${idEmEdicao ? "atualizado" : "adicionado"} com sucesso!`
          );
          sairDoModoEdicao();
          carregarLanches();
          mostrarTela("tela-gerenciar");
        } else {
          const erro = await response.json();
          throw new Error(
            erro.message ||
              `Erro ao ${idEmEdicao ? "atualizar" : "adicionar"} lanche.`
          );
        }
      } catch (error) {
        console.error("Erro:", error);
        alert(`Falha ao salvar lanche: ${error.message}`);
      }
    });
  }

  if (formAdicional) {
    formAdicional.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nome = document.getElementById("adicional-nome").value.trim();
      const preco = document
        .getElementById("adicional-preco")
        .value.replace(",", ".");

      if (!nome) {
        alert("Informe o nome do adicional.");
        return;
      }
      if (!preco || Number.isNaN(Number(preco))) {
        alert("Informe um preço válido.");
        return;
      }

      const payload = { nome, preco: Number(preco) };
      const url = adicionalEmEdicao
        ? `${API_BASE}/adicionais/${adicionalEmEdicao}`
        : `${API_BASE}/adicionais`;
      const method = adicionalEmEdicao ? "PUT" : "POST";

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const erro = await response.json();
          throw new Error(erro.message || "Falha ao salvar adicional.");
        }
        alert(
          `Adicional ${adicionalEmEdicao ? "atualizado" : "adicionado"}!`
        );
        sairDoModoEdicaoAdicional();
        carregarAdicionais();
      } catch (error) {
        alert(`Erro: ${error.message}`);
      }
    });
  }

  if (tabelaCorpo) {
    tabelaCorpo.addEventListener("click", async (event) => {
      const target = event.target;
      const id = target.dataset.id;

      if (target.classList.contains("btn-deletar")) {
        if (confirm("Você tem certeza que deseja deletar este lanche?")) {
          try {
            const response = await fetch(
              `${API_BASE}/deletar/hamburguer/${id}`,
              { method: "DELETE" }
            );
            if (response.ok) {
              alert("Lanche deletado com sucesso!");
              carregarLanches();
            } else {
              throw new Error("Falha ao deletar o lanche.");
            }
          } catch (error) {
            alert(`Ocorreu um erro: ${error.message}`);
          }
        }
      }

      if (target.classList.contains("btn-editar")) {
        try {
          const response = await fetch(
            `${API_BASE}/buscar/hamburguer/${id}?t=${Date.now()}`
          );
          if (!response.ok) throw new Error("Falha ao buscar lanche");
          const lanche = await response.json();
          entrarNoModoEdicao(lanche);
        } catch (error) {
          alert("Erro ao carregar dados para edição.");
        }
      }
    });
  }

  if (tabelaAdicionais) {
    tabelaAdicionais.addEventListener("click", async (event) => {
      const target = event.target;
      const id = target.dataset.id;

      if (target.classList.contains("btn-deletar")) {
        if (confirm("Deseja deletar este adicional?")) {
          try {
            const response = await fetch(`${API_BASE}/adicionais/${id}`, {
              method: "DELETE",
            });
            if (!response.ok) throw new Error("Falha ao deletar adicional.");
            carregarAdicionais();
          } catch (error) {
            alert(`Erro: ${error.message}`);
          }
        }
      }

      if (target.classList.contains("btn-editar")) {
        const row = target.closest("tr");
        if (!row) return;
        adicionalEmEdicao = id;
        tituloFormAdicional.textContent = "Editar adicional";
        btnCancelarAdicional.style.display = "inline-block";
        document.getElementById("adicional-nome").value =
          row.dataset.nome || "";
        document.getElementById("adicional-preco").value =
          row.dataset.preco || "";
      }
    });
  }

  if (inputFiltro) {
    inputFiltro.addEventListener("input", () => {
      const termo = inputFiltro.value.trim().toLowerCase();
      Array.from(tabelaCorpo.querySelectorAll("tr")).forEach((tr) => {
        const texto = tr.innerText.toLowerCase();
        tr.style.display = texto.includes(termo) ? "" : "none";
      });
    });
  }

  // --- 4. INICIALIZAÇÃO DA PÁGINA ---
  verificarStatusLoja();
 
  carregarCategoriasExtras();
  carregarLanches();
  mostrarTela("tela-gerenciar");
});

