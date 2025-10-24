document.addEventListener("DOMContentLoaded", () => {
  // **Verificação de segurança inicial**
  if (sessionStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
    return; // Interrompe a execução do script se não estiver logado
  }

  const API_BASE = `http://${location.hostname}:3000`;

  // --- 1. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
  const btnMostrarGerenciar = document.getElementById("btn-mostrar-gerenciar");
  const btnMostrarAdicionar = document.getElementById("btn-mostrar-adicionar");
  const btnAbrirAdicionar = document.getElementById("btn-abrir-adicionar");
  const btnLogout = document.getElementById("btn-logout");
  const telaGerenciar = document.getElementById("tela-gerenciar");
  const telaAdicionar = document.getElementById("tela-adicionar");
  const formAdicionar = document.getElementById("form-adicionar-lanche");
  const tituloForm = document.getElementById("titulo-form");
  const btnSubmit = document.getElementById("btn-submit");
  const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");
  const inputFiltro = document.getElementById("filtro-lanches");
  const tabelaCorpo = document.getElementById("tabela-lanches-corpo");
  const statusTexto = document.getElementById("status-atual-texto");
  const btnAbrirLoja = document.getElementById("btn-abrir-loja");
  const btnFecharLoja = document.getElementById("btn-fechar-loja");
  let idEmEdicao = null;

  // --- 2. FUNÇÕES ---

  function fazerLogout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
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
    btnMostrarGerenciar.classList.remove("active");
    btnMostrarAdicionar.classList.remove("active");

    if (idTelaParaMostrar === "tela-gerenciar") {
      telaGerenciar.style.display = "block";
      btnMostrarGerenciar.classList.add("active");
    } else if (idTelaParaMostrar === "tela-adicionar") {
      telaAdicionar.style.display = "block";
      btnMostrarAdicionar.classList.add("active");
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

      // Definir grupos de categorias com aliases — assim várias chaves (ex: refrigerantes, cocaCola220)
      // serão tratadas como "Bebidas" e não ficarão em 'Outros'.
      const grupos = {
        space: { label: "Space Burguer", aliases: ["space"] },
        smash: { label: "Smash Burguer", aliases: ["smash"] },
        combo: { label: "Combo", aliases: ["combo"] },
        bebidas: { label: "Bebidas", aliases: ["bebidas", "refrigerantes", "refrigerantes600", "refrigerantes1Litro", "refri2Litros", "cocaCola220", "sucos"] },
        porcoes: { label: "Porções", aliases: ["porcoes"] },
      };

      // Criar seções (tabela) para cada grupo e uma seção "Outros"
      const sectionTbodyMap = {};
      Object.keys(grupos).forEach((key) => {
        const section = document.createElement("section");
        section.className = "categoria-section";
        section.innerHTML = `
          <h3>${grupos[key].label}</h3>
          <table class="tabela-categoria">
            <thead>
              <tr><th>Imagem</th><th>Nome</th><th>Preço</th><th>Categorias</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody data-categoria="${key}"></tbody>
          </table>
        `;
        tabelaCorpo.appendChild(section);
        sectionTbodyMap[key] = section.querySelector('tbody');
      });

      // seção para categorias não listadas
      const outrosSection = document.createElement("section");
      outrosSection.className = "categoria-section";
      outrosSection.innerHTML = `
        <h3>Outros</h3>
        <table class="tabela-categoria">
          <thead>
            <tr><th>Imagem</th><th>Nome</th><th>Preço</th><th>Categorias</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody data-categoria="outros"></tbody>
        </table>
      `;
      tabelaCorpo.appendChild(outrosSection);
      sectionTbodyMap.outros = outrosSection.querySelector('tbody');

      
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
  carregarLanches();
  mostrarTela("tela-gerenciar");
});
