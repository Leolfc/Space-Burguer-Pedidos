// Espera o HTML carregar antes de executar qualquer código
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = `http://${location.hostname}:3000`;
  // --- 1. REFERÊNCIAS AOS ELEMENTOS ---
  // Botões de navegação
  const btnMostrarGerenciar = document.getElementById("btn-mostrar-gerenciar");
  const btnMostrarAdicionar = document.getElementById("btn-mostrar-adicionar");
  const btnAbrirAdicionar = document.getElementById("btn-abrir-adicionar");

  // Telas (divs)
  const telaGerenciar = document.getElementById("tela-gerenciar");
  const telaAdicionar = document.getElementById("tela-adicionar");

  // Formulário de adicionar
  const formAdicionar = document.getElementById("form-adicionar-lanche");
  const tituloForm = document.getElementById("titulo-form");
  const btnSubmit = document.getElementById("btn-submit");
  const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");
  const inputFiltro = document.getElementById("filtro-lanches");

  // Estado de edição
  let idEmEdicao = null;

  // Corpo da tabela de lanches
  const tabelaCorpo = document.getElementById("tabela-lanches-corpo");

  // --- 2. LÓGICA DE NAVEGAÇÃO ENTRE TELAS (O CORAÇÃO DA SPA) ---

  // Função que esconde todas as telas e mostra apenas a desejada
  function mostrarTela(idTelaParaMostrar) {
    // Esconde todas as telas
    telaGerenciar.style.display = "none";
    telaAdicionar.style.display = "none";

    // Remove a classe 'active' de todos os botões
    btnMostrarGerenciar.classList.remove("active");
    btnMostrarAdicionar.classList.remove("active");

    // Mostra a tela correta e ativa o botão correspondente
    if (idTelaParaMostrar === "tela-gerenciar") {
      telaGerenciar.style.display = "block";
      btnMostrarGerenciar.classList.add("active");
    } else if (idTelaParaMostrar === "tela-adicionar") {
      telaAdicionar.style.display = "block";
      btnMostrarAdicionar.classList.add("active");
    }
  }

  // Eventos de clique nos botões de navegação
  btnMostrarGerenciar.addEventListener("click", () => {
    carregarLanches(); // Sempre recarrega os lanches ao ir para a tela de gerenciamento
    mostrarTela("tela-gerenciar");
  });

  btnMostrarAdicionar.addEventListener("click", () => {
    mostrarTela("tela-adicionar");
  });

  if (btnAbrirAdicionar) {
    btnAbrirAdicionar.addEventListener("click", () => {
      // Garantir que estamos em modo de criação
      if (typeof sairDoModoEdicao === "function") {
        sairDoModoEdicao();
      }
      mostrarTela("tela-adicionar");
    });
  }

  // --- 3. LÓGICA DA TELA "GERENCIAR" ---

  async function carregarLanches() {
    try {
      const response = await fetch(
        `${API_BASE}/buscar/hamburguers?t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Falha ao buscar lanches.");

      const lanches = await response.json();
      tabelaCorpo.innerHTML = ""; // Limpa a tabela

      lanches.forEach((lanche) => {
        const linha = document.createElement("tr");
        const precoFormatado = `R$ ${parseFloat(lanche.preco)
          .toFixed(2)
          .replace(".", ",")}`;
        const categoriasTexto = lanche.categoria.join(", ");
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

        linha.innerHTML = `
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
        tabelaCorpo.appendChild(linha);
      });
    } catch (error) {
      console.error("Erro ao carregar lanches:", error);
      tabelaCorpo.innerHTML =
        '<tr><td colspan="5">Erro ao carregar cardápio.</td></tr>';
    }
  }

  // --- 4. LÓGICA DA TELA "ADICIONAR" ---

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

    // Monta FormData para suportar upload via multer
    const formData = new FormData();
    formData.append("nome", document.getElementById("nome").value);
    formData.append("descricao", document.getElementById("descricao").value);
    formData.append("preco", document.getElementById("preco").value);
    // Envia categorias como JSON para preservar múltiplas seleções
    formData.append("categoria", JSON.stringify(categorias));
    formData.append(
      "novoItem",
      document.getElementById("novoItem").checked ? "true" : "false"
    );
    formData.append(
      "indisponivel",
      document.getElementById("indisponivel").checked ? "true" : "false"
    );
    const arquivo = document.getElementById("imagem_url").files?.[0];
    if (arquivo) {
      formData.append("imagem", arquivo);
    }

    try {
      // Se estamos editando, envia PUT; senão, POST
      if (idEmEdicao) {
        const response = await fetch(
          `${API_BASE}/editar/hamburguer/${idEmEdicao}`,
          {
            method: "PUT",
            body: formData,
          }
        );
        if (response.ok) {
          alert("Lanche atualizado com sucesso!");
          sairDoModoEdicao();
          await carregarLanches();
          mostrarTela("tela-gerenciar");
        } else {
          throw new Error("Erro ao atualizar lanche.");
        }
      } else {
        const response = await fetch(`${API_BASE}/adicionar/hamburguers`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          alert("Lanche adicionado com sucesso!");
          formAdicionar.reset();
          await carregarLanches();
          mostrarTela("tela-gerenciar");
        } else {
          throw new Error("Erro ao adicionar lanche.");
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Falha ao salvar lanche.");
    }
  });

  function entrarNoModoEdicao(lanche) {
    idEmEdicao = lanche.id;
    tituloForm.textContent = `Editar Lanche`;
    btnSubmit.textContent = "Salvar Alterações";
    btnCancelarEdicao.style.display = "inline-block";
    mostrarTela("tela-adicionar");

    // Preenche campos
    document.getElementById("nome").value = lanche.nome || "";
    document.getElementById("descricao").value = lanche.descricao || "";
    document.getElementById("preco").value = lanche.preco || "";
    // input type="file" não pode ter valor setado por segurança, então ignoramos.
    document.getElementById("novoItem").checked = !!lanche.novoItem;
    document.getElementById("indisponivel").checked = !!lanche.indisponivel;

    // Categorias
    formAdicionar.querySelectorAll('input[name="categoria"]').forEach((cb) => {
      cb.checked =
        Array.isArray(lanche.categoria) && lanche.categoria.includes(cb.value);
    });
  }

  function sairDoModoEdicao() {
    idEmEdicao = null;
    tituloForm.textContent = "Adicionar Novo Lanche";
    btnSubmit.textContent = "Adicionar Lanche ao Cardápio";
    btnCancelarEdicao.style.display = "none";
    formAdicionar.reset();
    // Desmarca categorias
    formAdicionar.querySelectorAll('input[name="categoria"]').forEach((cb) => {
      cb.checked = false;
    });
  }

  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", () => {
      sairDoModoEdicao();
      mostrarTela("tela-gerenciar");
    });
  }

  // --- 5. INICIALIZAÇÃO ---
  // Define a tela inicial que será mostrada ao carregar a página
  carregarLanches();
  mostrarTela("tela-gerenciar");

  // --- DELEGAÇÃO DE EVENTOS PARA AÇÕES NA TABELA ---

  // Adicionamos o "escutador" de cliques no corpo da tabela (o "pai")
  tabelaCorpo.addEventListener("click", async (event) => {
    // Verificamos se o elemento clicado (event.target) possui a classe 'btn-deletar'
    if (event.target.classList.contains("btn-deletar")) {
      // 1. Pega o ID do lanche guardado no atributo 'data-id' do botão
      const idDoLanche = event.target.dataset.id;

      // 2. Pede confirmação ao usuário
      const confirmou = confirm(
        "Você tem certeza que deseja deletar este lanche? Esta ação não pode ser desfeita."
      );

      // 3. Se o usuário clicou em "OK" (true), continua com a exclusão
      if (confirmou) {
        try {
          // 4. Envia a requisição DELETE para o backend, passando o ID na URL
          const response = await fetch(
            `${API_BASE}/deletar/hamburguer/${idDoLanche}`,
            {
              method: "DELETE",
            }
          );

          if (response.ok) {
            alert("Lanche deletado com sucesso!");
            // 5. Recarrega a lista de lanches para atualizar a tabela na tela
            carregarLanches();
          } else {
            // Tenta ler a mensagem de erro do backend, se houver
            const erro = await response.json();
            throw new Error(erro.message || "Falha ao deletar o lanche.");
          }
        } catch (error) {
          console.error("Erro ao deletar:", error);
          alert(`Ocorreu um erro ao tentar deletar o lanche: ${error.message}`);
        }
      }
    }

    // Editar
    if (event.target.classList.contains("btn-editar")) {
      const idDoLanche = event.target.dataset.id;
      try {
        const response = await fetch(
          `${API_BASE}/buscar/hamburguer/${idDoLanche}?t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Falha ao buscar lanche");
        const lanche = await response.json();
        entrarNoModoEdicao(lanche);
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados para edição.");
      }
    }
  });

  // Filtro de busca em tempo real
  document.addEventListener("DOMContentLoaded", () => {
  
    const inputFiltro = document.getElementById("filtro-lanches");
    const tabelaCorpo = document.getElementById("tabela-lanches-corpo");
    if (!inputFiltro || !tabelaCorpo) return;
    inputFiltro.addEventListener("input", () => {
      const termo = inputFiltro.value.trim().toLowerCase();
      Array.from(tabelaCorpo.querySelectorAll("tr")).forEach((tr) => {
        const texto = tr.innerText.toLowerCase();
        tr.style.display = texto.includes(termo) ? "" : "none";
      });
    });
  });
  
});

const fomularioLogin = document.getElementById("#formLogin");
