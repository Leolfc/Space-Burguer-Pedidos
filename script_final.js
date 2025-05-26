// Preços dos adicionais
const adicionais = {
  hamburguer160g: { nome: "Hambúrguer 160g", preco: 9.0 },
  hamburguer95g: { nome: "Hambúrguer 95g", preco: 6.5 },
  picles: { nome: "Picles", preco: 7.0 },
  queijoCheddar: { nome: "Queijo Cheddar", preco: 4.0 },
  queijoMussarela: { nome: "Queijo Mussarela", preco: 3.0 },
  bacon: { nome: "Bacon", preco: 8.0 },
  cebolaCaramelizada: { nome: "Cebola Caramelizada", preco: 7.0 },
  alfaceAmericana: { nome: "Alface Americana", preco: 2.0 },
  tomate: { nome: "Tomate", preco: 2.0 },
  cebolaRoxa: { nome: "Cebola Roxa", preco: 2.5 },
  catupiry: { nome: "Catupiry", preco: 6.5 },
  doritos: { nome: "Doritos", preco: 5.0 },
};

// Armazenar itens do carrinho
const carrinho = {
  itens: {},
  total: 0,
  contador: 0, // Contador para gerar IDs únicos para cada item adicionado
  itemAtual: null, // Referência para o item sendo editado atualmente
  nomeCliente: "", // Nome do cliente para o pedido
  enderecoCliente: "", // Endereço do cliente para o pedido
  formaPagamento: "", // Forma de pagamento
};

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  console.log("Documento carregado!");

  // Verificar se o objeto adicionais está corretamente definido
  console.log("Adicionais disponíveis:", adicionais);

  // Criar o modal de adicionais
  criarModalAdicionais();

  // Configurar campos de observação para combos
  configurarCamposObservacao();

  // Adicionar botões de observação a todos os itens
  adicionarBotoesObservacao();

  // Configurar eventos para os botões de adicionar e remover
  const botoesAdicionar = document.querySelectorAll(".btn-increase");
  const botoesRemover = document.querySelectorAll(".btn-decrease");

  botoesAdicionar.forEach((botao) => {
    botao.textContent = "Adicionar";
    botao.classList.add("btn-texto");
    botao.addEventListener("click", adicionarItem);
  });

  botoesRemover.forEach((botao) => {
    botao.textContent = "Remover";
    botao.classList.add("btn-texto");
    botao.addEventListener("click", removerItem);
  });

  // Configurar eventos para os botões de observações
  const botoesObservacao = document.querySelectorAll(".btn-observacao");
  botoesObservacao.forEach((botao) => {
    botao.addEventListener("click", mostrarCampoObservacao);
  });

  // Adicionar evento para o botão de limpar carrinho
  const btnLimparCarrinho = document.getElementById("btnLimparCarrinho");
  if (btnLimparCarrinho) {
    btnLimparCarrinho.addEventListener("click", limparCarrinho);
  }

  // Configurar pesquisa
  configurarPesquisa();

  // Adicionar evento para atualizar o nome do cliente
  const nomeClienteInput = document.getElementById("nomeCliente");
  if (nomeClienteInput) {
    nomeClienteInput.addEventListener("input", function () {
      carrinho.nomeCliente = this.value.trim();
    });

    // Verificar se há um nome salvo no localStorage
    const nomeSalvo = localStorage.getItem("nomeCliente");
    if (nomeSalvo) {
      nomeClienteInput.value = nomeSalvo;
      carrinho.nomeCliente = nomeSalvo;
    }
  }

  // Adicionar evento para atualizar o endereço do cliente
  const enderecoClienteInput = document.getElementById("enderecoCliente");
  if (enderecoClienteInput) {
    enderecoClienteInput.addEventListener("input", function () {
      carrinho.enderecoCliente = this.value.trim();
    });

    // Verificar se há um endereço salvo no localStorage
    const enderecoSalvo = localStorage.getItem("enderecoCliente");
    if (enderecoSalvo) {
      enderecoClienteInput.value = enderecoSalvo;
      carrinho.enderecoCliente = enderecoSalvo;
    }
  }

  // Adicionar evento para atualizar a forma de pagamento
  const formaPagamentoSelect = document.getElementById("formaPagamento");
  if (formaPagamentoSelect) {
    formaPagamentoSelect.addEventListener("change", function () {
      carrinho.formaPagamento = this.value;

      // Salvar a forma de pagamento no localStorage
      if (this.value) {
        localStorage.setItem("formaPagamento", this.value);
      }
    });

    // Verificar se há uma forma de pagamento salva no localStorage
    const formaPagamentoSalva = localStorage.getItem("formaPagamento");
    if (formaPagamentoSalva) {
      formaPagamentoSelect.value = formaPagamentoSalva;
      carrinho.formaPagamento = formaPagamentoSalva;
    }
  }

  // Adicionar evento para alternar entre modo claro e escuro
  configurarAlternadorTema();

  // Configurar botões flutuantes
  configurarBotoesFlutuantes();

  // Configurar botão de finalizar via WhatsApp
  configurarBotaoWhatsApp();
});

// Função para adicionar botões de observação a todos os itens
function adicionarBotoesObservacao() {
  // Obter apenas itens do tipo hamburger e combo
  const itens = document.querySelectorAll(
    '.item[data-tipo="hamburguer"], .item[data-tipo="combo"]'
  );

  itens.forEach((item) => {
    // Verificar se já tem o campo de observação (mantemos o campo mas removemos os botões visíveis)
    if (!item.querySelector(".item-observacao")) {
      // Criar campo de observação com opções predefinidas (mas oculto)
      const observacaoDiv = document.createElement("div");
      observacaoDiv.className = "item-observacao";
      observacaoDiv.style.display = "none";
      observacaoDiv.innerHTML = `
        <textarea placeholder="Ex: retirar tomate, sem cebola, etc." class="observacao-texto"></textarea>
        
        <div class="opcoes-rapidas">
          <button type="button" class="opcao-rapida" data-texto="Sem tomate">Sem tomate</button>
          <button type="button" class="opcao-rapida" data-texto="Sem cebola">Sem cebola</button>
          <button type="button" class="opcao-rapida" data-texto="Sem alface">Sem alface</button>
          <button type="button" class="opcao-rapida" data-texto="Sem molho">Sem molho</button>
          <button type="button" class="opcao-rapida" data-texto="Trocar queijo cheddar por mussarela">Trocar queijo cheddar por mussarela</button>
        </div>
        
        <div class="observacao-botoes">
          <button type="button" class="btn-confirmar-obs">Confirmar</button>
          <button type="button" class="btn-cancelar-obs">Cancelar</button>
        </div>
      `;

      // Adicionar após os controles de quantidade
      const itemActions = item.querySelector(".item-actions");
      if (itemActions) {
        // Adicionamos apenas o campo de observação, sem o botão visível
        itemActions.insertAdjacentElement("afterend", observacaoDiv);
      }

      // Adicionar evento para as opções rápidas
      observacaoDiv.querySelectorAll(".opcao-rapida").forEach((opcao) => {
        opcao.addEventListener("click", function () {
          const texto = this.dataset.texto;
          const textarea = observacaoDiv.querySelector("textarea");
          textarea.value += textarea.value ? ", " + texto : texto;
        });
      });

      // Criar botão de observação invisível para referência
      const btnObservacao = document.createElement("button");
      btnObservacao.type = "button";
      btnObservacao.className = "btn-observacao";
      btnObservacao.style.display = "none";
      btnObservacao.textContent = "Adicionar observação";
      if (itemActions) {
        itemActions.insertAdjacentElement("afterend", btnObservacao);
      }
    }
  });
}

// Configurar a funcionalidade de pesquisa
function configurarPesquisa() {
  const pesquisaInput = document.getElementById("pesquisaInput");
  const btnPesquisar = document.getElementById("btnPesquisar");
  const searchResultsCount = document.getElementById("searchResultsCount");

  // Função para realizar a pesquisa
  function realizarPesquisa() {
    const termoPesquisa = pesquisaInput.value.trim().toLowerCase();

    if (termoPesquisa.length < 2) {
      // Remover destaques anteriores
      document.querySelectorAll(".item").forEach((item) => {
        item.classList.remove("destaque");
        item.style.display = "";
      });

      // Mostrar todas as seções
      document.querySelectorAll("section").forEach((section) => {
        section.style.display = "";
      });

      searchResultsCount.textContent = "";
      return;
    }

    let itensEncontrados = 0;
    const sections = document.querySelectorAll("section");

    // Para cada seção, verificar os itens
    sections.forEach((section) => {
      let itensVisiveis = 0;
      const itens = section.querySelectorAll(".item");

      itens.forEach((item) => {
        const nomeItem = item
          .querySelector(".item-name")
          .textContent.toLowerCase();
        const descricaoItem = item.querySelector(".item-desc")
          ? item.querySelector(".item-desc").textContent.toLowerCase()
          : "";

        // Verificar se o termo de pesquisa está presente no nome ou na descrição
        if (
          nomeItem.includes(termoPesquisa) ||
          descricaoItem.includes(termoPesquisa)
        ) {
          item.classList.add("destaque");
          item.style.display = "";
          itensVisiveis++;
          itensEncontrados++;
        } else {
          item.classList.remove("destaque");
          item.style.display = "none";
        }
      });

      // Mostrar ou ocultar a seção dependendo se há itens visíveis
      section.style.display = itensVisiveis > 0 ? "" : "none";
    });

    // Atualizar contador de resultados
    if (itensEncontrados === 0) {
      searchResultsCount.textContent = "Nenhum item encontrado";
    } else {
      searchResultsCount.textContent = `${itensEncontrados} ${
        itensEncontrados === 1 ? "item encontrado" : "itens encontrados"
      }`;
    }

    // Fazer scroll para o primeiro item encontrado
    const primeiroEncontrado = document.querySelector(".destaque");
    if (primeiroEncontrado) {
      primeiroEncontrado.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  // Vincular eventos
  btnPesquisar.addEventListener("click", realizarPesquisa);

  // Pesquisar ao pressionar Enter
  pesquisaInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      realizarPesquisa();
    } else if (e.key === "Escape") {
      pesquisaInput.value = "";
      realizarPesquisa();
    } else if (pesquisaInput.value.trim().length >= 2) {
      // Pesquisa automática enquanto digita (após 2 caracteres)
      setTimeout(realizarPesquisa, 300);
    }
  });

  // Adicionar evento de input para detectar quando o campo é limpo
  pesquisaInput.addEventListener("input", () => {
    // Se o campo estiver vazio, resetar a pesquisa imediatamente
    if (pesquisaInput.value.trim() === "") {
      realizarPesquisa();
    }
  });

  // Limpar pesquisa ao clicar no X do input (somente em navegadores que suportam)
  pesquisaInput.addEventListener("search", realizarPesquisa);
}

// Criar o modal de adicionais (uma única vez)
function criarModalAdicionais() {
  // Verificar se o modal já existe
  if (document.querySelector(".adicionais-modal-overlay")) {
    console.log("Modal já existe, não criando novamente");
    return;
  }

  console.log("Criando modal de adicionais");

  // Criar o overlay do modal
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "adicionais-modal-overlay";

  // Criar container de adicionais
  const adicionaisContainer = document.createElement("div");
  adicionaisContainer.className = "adicionais-container";
  adicionaisContainer.style.position = "relative";
  modalOverlay.appendChild(adicionaisContainer);

  // Adicionar título
  const titulo = document.createElement("h3");
  titulo.textContent = "Escolha seus adicionais:";
  titulo.style.paddingRight = "40px"; // Espaço para o botão X
  adicionaisContainer.appendChild(titulo);

  // Adicionar botão para fechar (X mais visível)
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close-adicionais";
  closeButton.innerHTML = "×";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.width = "32px";
  closeButton.style.height = "32px";
  closeButton.style.borderRadius = "50%";
  closeButton.style.backgroundColor = "#f44336";
  closeButton.style.color = "white";
  closeButton.style.fontSize = "24px";
  closeButton.style.fontWeight = "bold";
  closeButton.style.display = "flex";
  closeButton.style.alignItems = "center";
  closeButton.style.justifyContent = "center";
  closeButton.style.cursor = "pointer";
  closeButton.style.zIndex = "10";
  closeButton.style.border = "none";

  // Adicionar evento de clique ao botão fechar
  closeButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    console.log("Botão fechar clicado");
    fecharModalAdicionais();
  });

  adicionaisContainer.appendChild(closeButton);

  // Criar lista de adicionais
  const adicionaisList = document.createElement("div");
  adicionaisList.className = "adicionais-list-select";
  adicionaisContainer.appendChild(adicionaisList);

  console.log(
    "Adicionando itens ao modal:",
    Object.keys(adicionais).length,
    "adicionais"
  );

  // Adicionar cada adicional à lista
  for (const [key, adicional] of Object.entries(adicionais)) {
    console.log(
      `Processando adicional: ${key} - ${adicional.nome} - R$${adicional.preco}`
    );

    // Criar item de adicional com borda mais visível
    const adicionalItem = document.createElement("div");
    adicionalItem.className = "adicional-item";
    adicionalItem.dataset.id = key;
    adicionalItem.style.border = "1px solid #ff5722";
    adicionalItem.style.marginBottom = "10px";

    // Informações do adicional com estilo mais visível
    const adicionalInfo = document.createElement("div");
    adicionalInfo.className = "adicional-info";

    // Nome do adicional com estilo destacado
    const adicionalNome = document.createElement("span");
    adicionalNome.className = "adicional-nome";
    adicionalNome.textContent = adicional.nome;
    adicionalNome.style.fontWeight = "bold";
    adicionalNome.style.fontSize = "16px";
    adicionalNome.style.color = "#333";
    adicionalInfo.appendChild(adicionalNome);

    // Preço do adicional
    const adicionalPreco = document.createElement("span");
    adicionalPreco.className = "adicional-preco";
    adicionalPreco.textContent = `R$ ${adicional.preco.toFixed(2)}`;
    adicionalPreco.style.fontWeight = "bold";
    adicionalPreco.style.color = "#ff5722";
    adicionalInfo.appendChild(adicionalPreco);

    // Controles de quantidade
    const quantidadeControle = document.createElement("div");
    quantidadeControle.className = "quantidade-controle";

    // Botão diminuir
    const btnDecrease = document.createElement("button");
    btnDecrease.type = "button";
    btnDecrease.className = "btn-decrease-adicional";
    btnDecrease.textContent = "-";
    btnDecrease.dataset.id = key;
    btnDecrease.addEventListener("click", function () {
      const qtySpan = quantidadeControle.querySelector(
        `.adicional-qty[data-id="${key}"]`
      );
      let quantidade = parseInt(qtySpan.textContent);
      if (quantidade > 0) {
        quantidade--;
        qtySpan.textContent = quantidade;
        atualizarResumoAdicionais();
      }
    });
    quantidadeControle.appendChild(btnDecrease);

    // Quantidade
    const qtySpan = document.createElement("span");
    qtySpan.className = "adicional-qty";
    qtySpan.dataset.id = key;
    qtySpan.textContent = "0";
    quantidadeControle.appendChild(qtySpan);

    // Botão aumentar
    const btnIncrease = document.createElement("button");
    btnIncrease.type = "button";
    btnIncrease.className = "btn-increase-adicional";
    btnIncrease.textContent = "+";
    btnIncrease.dataset.id = key;
    btnIncrease.addEventListener("click", function () {
      const qtySpan = quantidadeControle.querySelector(
        `.adicional-qty[data-id="${key}"]`
      );
      let quantidade = parseInt(qtySpan.textContent) + 1;
      qtySpan.textContent = quantidade;
      atualizarResumoAdicionais();
    });
    quantidadeControle.appendChild(btnIncrease);

    adicionalItem.appendChild(adicionalInfo);
    adicionalItem.appendChild(quantidadeControle);
    adicionaisList.appendChild(adicionalItem);
  }

  // Adicionar campo para observações
  const observacoesDiv = document.createElement("div");
  observacoesDiv.className = "observacoes-container";
  observacoesDiv.innerHTML = `
    <h4>Observações</h4>
    <p class="observacao-exemplo">Ex: retirar tomate, sem cebola, etc.</p>
    <textarea id="observacoes-pedido" placeholder="Alguma observação sobre o preparo?"></textarea>
    
    <div class="opcoes-rapidas">
      <button type="button" class="opcao-rapida" data-texto="Sem tomate">Sem tomate</button>
      <button type="button" class="opcao-rapida" data-texto="Sem cebola">Sem cebola</button>
      <button type="button" class="opcao-rapida" data-texto="Sem alface">Sem alface</button>
      <button type="button" class="opcao-rapida" data-texto="Sem molho">Sem molho</button>
      <button type="button" class="opcao-rapida" data-texto="Bem passado">Bem passado</button>
      <button type="button" class="opcao-rapida" data-texto="Ao ponto">Ao ponto</button>
      <button type="button" class="opcao-rapida" data-texto="Mal passado">Mal passado</button>
    </div>
  `;
  adicionaisContainer.appendChild(observacoesDiv);

  // Adicionar eventos para as opções rápidas de observação
  observacoesDiv.querySelectorAll(".opcao-rapida").forEach((opcao) => {
    opcao.addEventListener("click", function () {
      const texto = this.dataset.texto;
      const textarea = document.getElementById("observacoes-pedido");
      textarea.value += textarea.value ? ", " + texto : texto;
      // Destacar visualmente o botão selecionado
      this.classList.add("selecionado");
      setTimeout(() => this.classList.remove("selecionado"), 500);
    });
  });

  // Resumo dos adicionais selecionados
  const selecionadosDiv = document.createElement("div");
  selecionadosDiv.className = "adicionais-selecionados";
  selecionadosDiv.innerHTML = "<p>Adicionais selecionados:</p><ul></ul>";
  adicionaisContainer.appendChild(selecionadosDiv);

  // Botão confirmar
  const btnConfirmar = document.createElement("button");
  btnConfirmar.type = "button";
  btnConfirmar.className = "btn-confirmar-adicionais";
  btnConfirmar.textContent = "Confirmar";

  // Adicionar evento de clique ao botão confirmar
  btnConfirmar.addEventListener("click", function (event) {
    event.preventDefault();
    console.log("Botão confirmar clicado");
    confirmarAdicionais();
  });

  adicionaisContainer.appendChild(btnConfirmar);

  // Adicionar o modal ao body
  document.body.appendChild(modalOverlay);

  console.log("Modal de adicionais criado com sucesso");
}

// Atualizar o resumo dos adicionais selecionados
function atualizarResumoAdicionais() {
  console.log("Atualizando resumo dos adicionais");

  const selecionadosDiv = document.querySelector(".adicionais-selecionados");
  const selecionadosLista = selecionadosDiv.querySelector("ul");
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");

  // Obter todos os spans de quantidade
  const qtySpans = modalOverlay.querySelectorAll(".adicional-qty");

  console.log("Spans de quantidade encontrados:", qtySpans.length);

  // Limpar lista atual
  selecionadosLista.innerHTML = "";

  // Verificar se há adicionais selecionados
  let temSelecionados = false;
  let totalAdicionais = 0;
  let totalItens = 0;

  qtySpans.forEach((span) => {
    const quantidade = parseInt(span.textContent);
    if (quantidade > 0) {
      temSelecionados = true;
      totalItens += quantidade;
      const adicionalId = span.dataset.id;
      const adicional = adicionais[adicionalId];

      if (!adicional) {
        console.error("Adicional não encontrado:", adicionalId);
        return;
      }

      console.log(`Adicional selecionado: ${adicional.nome} x${quantidade}`);

      const subtotal = adicional.preco * quantidade;
      totalAdicionais += subtotal;

      // Criar item da lista com uma apresentação mais destacada
      const li = document.createElement("li");
      li.style.padding = "8px";
      li.style.marginBottom = "8px";
      li.style.backgroundColor = "#fff";
      li.style.borderRadius = "6px";
      li.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      li.dataset.id = adicionalId;

      const itemDiv = document.createElement("div");
      itemDiv.className = "adicional-resumo";
      itemDiv.style.display = "flex";
      itemDiv.style.alignItems = "center";
      itemDiv.style.gap = "10px";
      itemDiv.style.position = "relative";

      // Quantidade
      const qtySpan = document.createElement("span");
      qtySpan.className = "adicional-resumo-quantidade";
      qtySpan.textContent = `${quantidade}x`;
      qtySpan.style.backgroundColor = "#ffebee";
      qtySpan.style.color = "#e53935";
      qtySpan.style.borderRadius = "12px";
      qtySpan.style.padding = "2px 8px";
      qtySpan.style.fontWeight = "bold";
      itemDiv.appendChild(qtySpan);

      // Nome
      const nomeSpan = document.createElement("span");
      nomeSpan.className = "adicional-resumo-nome";
      nomeSpan.textContent = adicional.nome;
      nomeSpan.style.flex = "1";
      nomeSpan.style.fontWeight = "600";
      itemDiv.appendChild(nomeSpan);

      // Preço
      const precoSpan = document.createElement("span");
      precoSpan.className = "adicional-resumo-preco";
      precoSpan.textContent = `R$ ${subtotal.toFixed(2)}`;
      precoSpan.style.color = "#ff5722";
      precoSpan.style.fontWeight = "700";
      itemDiv.appendChild(precoSpan);

      // Botão de remover (X)
      const btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.className = "btn-remover-adicional";
      btnRemover.textContent = "×";
      btnRemover.style.backgroundColor = "#f44336";
      btnRemover.style.color = "white";
      btnRemover.style.border = "none";
      btnRemover.style.borderRadius = "50%";
      btnRemover.style.width = "22px";
      btnRemover.style.height = "22px";
      btnRemover.style.display = "flex";
      btnRemover.style.alignItems = "center";
      btnRemover.style.justifyContent = "center";
      btnRemover.style.fontSize = "16px";
      btnRemover.style.fontWeight = "bold";
      btnRemover.style.cursor = "pointer";
      btnRemover.style.marginLeft = "5px";

      // Adicionar evento de clique para remover o adicional
      btnRemover.addEventListener("click", function () {
        // Encontrar o span de quantidade correspondente
        const qtySpan = modalOverlay.querySelector(
          `.adicional-qty[data-id="${adicionalId}"]`
        );
        if (qtySpan) {
          // Zerar a quantidade
          qtySpan.textContent = "0";
          // Atualizar o resumo
          atualizarResumoAdicionais();
        }
      });

      itemDiv.appendChild(btnRemover);

      li.appendChild(itemDiv);
      selecionadosLista.appendChild(li);
    }
  });

  // Mostrar ou esconder o resumo
  selecionadosDiv.style.display = temSelecionados ? "block" : "none";

  console.log(
    `Total de itens: ${totalItens}, Total: R$ ${totalAdicionais.toFixed(2)}`
  );

  // Adicionar total dos adicionais de forma mais destacada
  if (temSelecionados) {
    // Atualizar título para mostrar quantidade
    selecionadosDiv.querySelector(
      "p"
    ).textContent = `Adicionais selecionados (${totalItens} ${
      totalItens === 1 ? "item" : "itens"
    }):`;

    // Adicionar total com destaque
    const totalLi = document.createElement("li");
    totalLi.className = "adicionais-total";
    totalLi.style.marginTop = "10px";
    totalLi.style.paddingTop = "8px";
    totalLi.style.borderTop = "1px dashed #ffccbc";

    const totalDiv = document.createElement("div");
    totalDiv.className = "adicional-resumo-total";
    totalDiv.style.display = "flex";
    totalDiv.style.justifyContent = "space-between";
    totalDiv.style.alignItems = "center";
    totalDiv.style.fontWeight = "700";

    const labelSpan = document.createElement("span");
    labelSpan.textContent = "Total dos adicionais:";
    totalDiv.appendChild(labelSpan);

    const valorSpan = document.createElement("span");
    valorSpan.className = "adicional-resumo-valor";
    valorSpan.textContent = `R$ ${totalAdicionais.toFixed(2)}`;
    valorSpan.style.color = "#ff5722";
    valorSpan.style.fontSize = "1.1rem";
    totalDiv.appendChild(valorSpan);

    totalLi.appendChild(totalDiv);
    selecionadosLista.appendChild(totalLi);
  }
}

// Função para mostrar pergunta sobre adicionais dentro do item
function mostrarPerguntaAdicionais(
  itemDiv,
  id,
  nome,
  valor,
  tipo,
  observacao = ""
) {
  // Se não for hambúrguer ou combo, adiciona direto ao carrinho
  if (tipo !== "hamburguer" && tipo !== "combo") {
    adicionarItemAoCarrinho(id, nome, valor, tipo, [], observacao);
    return;
  }

  // Remover pergunta anterior se existir
  const perguntaAnterior = itemDiv.querySelector(".pergunta-adicionais");
  if (perguntaAnterior) {
    perguntaAnterior.remove();
  }

  // Texto da pergunta baseado no tipo de item
  let perguntaTexto = "";
  let btnNaoTexto = "";
  let btnSimTexto = "";

  if (tipo === "combo") {
    perguntaTexto = "Deseja personalizar ou adicionar observações ao combo?";
    btnNaoTexto = "Sem personalização";
    btnSimTexto = "Personalizar combo";
  } else {
    perguntaTexto = "Deseja adicionais ou alguma observação?";
    btnNaoTexto = "Sem adicionais/observações";
    btnSimTexto = "Personalizar";
  }

  // Criar elemento da pergunta
  const perguntaDiv = document.createElement("div");
  perguntaDiv.className = "pergunta-adicionais";
  perguntaDiv.innerHTML = `
    <p>${perguntaTexto}</p>
    <div class="pergunta-botoes">
      <button type="button" class="btn-nao">${btnNaoTexto}</button>
      <button type="button" class="btn-sim">${btnSimTexto}</button>
    </div>
  `;

  // Adicionar após os controles de quantidade
  const itemActions = itemDiv.querySelector(".item-actions");
  itemActions.insertAdjacentElement("afterend", perguntaDiv);

  // Adicionar eventos aos botões
  const btnNao = perguntaDiv.querySelector(".btn-nao");
  const btnSim = perguntaDiv.querySelector(".btn-sim");

  btnNao.addEventListener("click", function () {
    // Remover a pergunta
    perguntaDiv.remove();

    // Adicionar o item diretamente ao carrinho sem adicionais, mas com a observação se houver
    adicionarItemAoCarrinho(id, nome, valor, tipo, [], observacao);
  });

  btnSim.addEventListener("click", function () {
    // Remover a pergunta
    perguntaDiv.remove();

    // Mostrar o modal de adicionais
    abrirModalAdicionais(itemDiv, id, nome, valor, tipo, observacao);
  });

  // Fazer scroll para a pergunta em telas pequenas
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      perguntaDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }
}

// Função para abrir o modal de adicionais
function abrirModalAdicionais(itemDiv, id, nome, valor, tipo, observacao = "") {
  console.log("Abrindo modal de adicionais para:", nome);

  // Guardar referência ao item atual
  carrinho.itemAtual = { itemDiv, id, nome, valor, tipo, observacao };

  // Obter o modal
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (!modalOverlay) {
    console.error("Modal não encontrado!");
    criarModalAdicionais(); // Criar o modal se não existir
    return abrirModalAdicionais(itemDiv, id, nome, valor, tipo, observacao); // Chamar novamente após criar
  }

  // Resetar todas as quantidades de adicionais
  const qtySpans = modalOverlay.querySelectorAll(".adicional-qty");
  qtySpans.forEach((span) => {
    span.textContent = "0";
  });

  // Preencher o campo de observações se existir
  const observacoesInput = document.getElementById("observacoes-pedido");
  if (observacoesInput) {
    observacoesInput.value = observacao;
  }

  // Esconder o resumo
  const selecionadosDiv = modalOverlay.querySelector(
    ".adicionais-selecionados"
  );
  if (selecionadosDiv) {
    selecionadosDiv.style.display = "none";
  }

  // Definir textos baseados no tipo de item
  let tituloTexto, observacaoTexto, btnTexto;

  if (tipo === "combo") {
    tituloTexto = `Personalizar Combo: ${nome}`;
    observacaoTexto = "Deseja adicionar alguma observação ao combo?";
    btnTexto = "Confirmar Personalização";
  } else {
    tituloTexto = `Adicionais e Observações: ${nome}`;
    observacaoTexto = "Deseja adicionar alguma observação?";
    btnTexto = "Confirmar e Adicionar ao Carrinho";
  }

  // Atualizar o título do modal para destacar que pode adicionar adicionais e observações
  const tituloModal = modalOverlay.querySelector("h3");
  if (tituloModal) {
    tituloModal.textContent = tituloTexto;
    tituloModal.style.color = "#ff5722";
    tituloModal.style.fontSize = "18px";
    tituloModal.style.fontWeight = "bold";
    tituloModal.style.textAlign = "center";
    tituloModal.style.marginBottom = "15px";
    tituloModal.style.paddingBottom = "10px";
    tituloModal.style.borderBottom = "2px solid #ff5722";
    tituloModal.style.paddingRight = "40px"; // Espaço para o botão X
  }

  // Atualizar o texto na seção de observações
  const observacoesContainer = modalOverlay.querySelector(
    ".observacoes-container h4"
  );
  if (observacoesContainer) {
    observacoesContainer.textContent = observacaoTexto;
    observacoesContainer.style.fontSize = "16px";
    observacoesContainer.style.fontWeight = "bold";
    observacoesContainer.style.marginBottom = "10px";
  }

  // Atualizar texto do botão confirmar
  const btnConfirmar = modalOverlay.querySelector(".btn-confirmar-adicionais");
  if (btnConfirmar) {
    btnConfirmar.textContent = btnTexto;
    btnConfirmar.style.backgroundColor = "#ff5722";
    btnConfirmar.style.color = "#fff";
    btnConfirmar.style.padding = "15px";
    btnConfirmar.style.fontSize = "16px";
    btnConfirmar.style.fontWeight = "bold";
    btnConfirmar.style.borderRadius = "8px";
    btnConfirmar.style.marginTop = "15px";
    btnConfirmar.style.cursor = "pointer";

    // Garantir que o evento de clique esteja atribuído
    btnConfirmar.onclick = function (event) {
      event.preventDefault();
      console.log("Botão confirmar clicado");
      confirmarAdicionais();
    };
  }

  // Verificar o botão de fechar
  const btnFechar = modalOverlay.querySelector(".btn-close-adicionais");
  if (btnFechar) {
    // Garantir que o evento de clique esteja atribuído
    btnFechar.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      console.log("Botão fechar clicado");
      fecharModalAdicionais();
    };
  }

  // Verificar se os nomes dos adicionais estão visíveis
  const adicionaisItems = modalOverlay.querySelectorAll(".adicional-item");
  console.log(`Verificando ${adicionaisItems.length} itens de adicionais`);

  adicionaisItems.forEach((item, index) => {
    const nomeElement = item.querySelector(".adicional-nome");
    const precoElement = item.querySelector(".adicional-preco");

    if (nomeElement) {
      console.log(`Item ${index + 1}: ${nomeElement.textContent}`);
    } else {
      console.error(`Nome não encontrado no item ${index + 1}`);
    }

    if (precoElement) {
      console.log(`Preço: ${precoElement.textContent}`);
    } else {
      console.error(`Preço não encontrado no item ${index + 1}`);
    }
  });

  // Configurar os botões do modal para garantir que os eventos de clique funcionem
  configurarBotoesModal();

  // Mostrar o modal
  modalOverlay.classList.add("show");
  modalOverlay.style.display = "flex";

  // Verificar se o modal está visível
  console.log(
    "Estado do modal após abrir:",
    modalOverlay.style.display,
    modalOverlay.classList.contains("show")
  );

  // Impedir o scroll da página
  document.body.style.overflow = "hidden";
}

// Função para fechar o modal de adicionais
function fecharModalAdicionais() {
  console.log("Fechando modal de adicionais");

  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (modalOverlay) {
    // Remover a classe show
    modalOverlay.classList.remove("show");

    // Garantir que o display seja none
    modalOverlay.style.display = "none";

    // Permitir o scroll da página
    document.body.style.overflow = "";

    // Limpar item atual
    carrinho.itemAtual = null;

    console.log("Modal fechado com sucesso");
  } else {
    console.error("Modal não encontrado para fechar");
  }
}

// Função para editar um item do carrinho
function editarItemDoCarrinho(uniqueId) {
  console.log("Editando item:", uniqueId);

  const item = carrinho.itens[uniqueId];
  if (!item) {
    console.error("Item não encontrado no carrinho");
    return;
  }

  // Encontrar o item original no menu
  const itemDiv = document.querySelector(`.item[data-id="${item.id}"]`);
  if (!itemDiv) {
    console.error("Item original não encontrado no menu");
    return;
  }

  // Configurar o item atual para edição
  carrinho.itemAtual = {
    itemDiv,
    id: item.id,
    nome: item.nome,
    valor: item.valor,
    tipo: item.tipo,
    observacao: item.observacoes || "",
    uniqueId: uniqueId,
  };

  // Obter o modal
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (!modalOverlay) {
    console.log("Modal não encontrado, criando novo...");
    criarModalAdicionais();
  }

  // Resetar todas as quantidades de adicionais
  const qtySpans = modalOverlay.querySelectorAll(".adicional-qty");
  qtySpans.forEach((span) => {
    span.textContent = "0";
  });

  // Preencher os adicionais existentes
  if (item.adicionais && item.adicionais.length > 0) {
    item.adicionais.forEach((adicional) => {
      const span = modalOverlay.querySelector(
        `.adicional-qty[data-id="${adicional.id}"]`
      );
      if (span) {
        const quantidade = item.adicionais.filter(
          (a) => a.id === adicional.id
        ).length;
        span.textContent = quantidade;
      }
    });
  }

  // Preencher o campo de observações
  const observacoesInput = document.getElementById("observacoes-pedido");
  if (observacoesInput) {
    observacoesInput.value = item.observacoes || "";
  }

  // Atualizar o título do modal
  const tituloModal = modalOverlay.querySelector("h3");
  if (tituloModal) {
    tituloModal.textContent = `Editando: ${item.nome}`;
  }

  // Atualizar o resumo dos adicionais
  atualizarResumoAdicionais();

  // Mostrar o modal
  modalOverlay.classList.add("show");
  modalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Configurar os botões do modal
  configurarBotoesModal();

  console.log("Modal aberto para edição");
}

// Modificar a função confirmarAdicionais para suportar edição
function confirmarAdicionais() {
  console.log("Confirmando adicionais...");

  if (!carrinho.itemAtual) {
    console.error("Item atual não encontrado!");
    return;
  }

  const { id, nome, valor, tipo, observacao, uniqueId } = carrinho.itemAtual;
  console.log(`Confirmando para: ${nome}`);

  // Obter adicionais selecionados
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (!modalOverlay) {
    console.error("Modal não encontrado!");
    return;
  }

  const qtySpans = modalOverlay.querySelectorAll(".adicional-qty");
  const adicionaisSelecionados = [];

  console.log(`Processando ${qtySpans.length} spans de quantidade`);

  qtySpans.forEach((span) => {
    const quantidade = parseInt(span.textContent);
    if (quantidade > 0) {
      const adicionalId = span.dataset.id;
      console.log(
        `Adicional selecionado: ${adicionalId}, quantidade: ${quantidade}`
      );

      const adicional = adicionais[adicionalId];

      if (!adicional) {
        console.error("Adicional não encontrado:", adicionalId);
        return;
      }

      console.log(`Adicionando ${quantidade}x ${adicional.nome}`);

      for (let i = 0; i < quantidade; i++) {
        adicionaisSelecionados.push({
          id: adicionalId,
          nome: adicional.nome,
          preco: adicional.preco,
        });
      }
    }
  });

  // Obter observações atualizadas do pedido
  const observacoesInput = document.getElementById("observacoes-pedido");
  const observacaoAtualizada = observacoesInput
    ? observacoesInput.value.trim()
    : observacao;

  // Calcular preço total dos adicionais
  let adicionaisTotal = 0;
  adicionaisSelecionados.forEach((adicional) => {
    adicionaisTotal += adicional.preco;
  });

  // Se estiver editando um item existente
  if (uniqueId) {
    // Atualizar o item existente
    carrinho.itens[uniqueId] = {
      ...carrinho.itens[uniqueId],
      adicionais: adicionaisSelecionados,
      adicionaisTotal,
      observacoes: observacaoAtualizada,
    };
  } else {
    // Adicionar novo item ao carrinho
    adicionarItemAoCarrinho(
      id,
      nome,
      valor,
      tipo,
      adicionaisSelecionados,
      observacaoAtualizada
    );
  }

  // Exibir notificação
  mostrarNotificacao(
    `${nome} ${uniqueId ? "atualizado" : "adicionado"} ao carrinho!`
  );

  // Fechar o modal
  modalOverlay.classList.remove("show");
  modalOverlay.style.display = "none";
  document.body.style.overflow = "";

  // Limpar item atual
  carrinho.itemAtual = null;

  // Atualizar o carrinho
  atualizarCarrinho();
}

// Função para mostrar o campo de observação do item
function mostrarCampoObservacao(event) {
  const itemDiv = event.target.closest(".item");
  const observacaoDiv = itemDiv.querySelector(".item-observacao");

  if (observacaoDiv) {
    // Mostrar o campo de observação
    observacaoDiv.style.display = "block";
    const textarea = observacaoDiv.querySelector("textarea");
    textarea.focus();

    // Configurar os botões do campo de observação
    const btnConfirmar = observacaoDiv.querySelector(".btn-confirmar-obs");
    const btnCancelar = observacaoDiv.querySelector(".btn-cancelar-obs");

    // Remover eventos anteriores para evitar duplicação
    btnConfirmar.removeEventListener("click", confirmarObservacao);
    btnCancelar.removeEventListener("click", cancelarObservacao);

    // Adicionar novos eventos
    btnConfirmar.addEventListener("click", confirmarObservacao);
    btnCancelar.addEventListener("click", cancelarObservacao);
  }
}

// Função para confirmar uma observação
function confirmarObservacao(event) {
  const itemDiv = event.target.closest(".item");
  const observacaoDiv = itemDiv.querySelector(".item-observacao");
  const textarea = observacaoDiv.querySelector("textarea");
  const btnObservacao = itemDiv.querySelector(".btn-observacao");

  const observacao = textarea.value.trim();

  // Se houver uma observação, alterar o texto do botão
  if (observacao) {
    btnObservacao.textContent = "Observação adicionada ✓";
    btnObservacao.style.backgroundColor = "#e8f5e9";
    btnObservacao.style.borderColor = "#a5d6a7";
    btnObservacao.style.color = "#388e3c";

    // Armazenar a observação no atributo data para uso posterior
    itemDiv.dataset.observacao = observacao;
  } else {
    // Se não houver observação, resetar o botão
    btnObservacao.textContent = "Adicionar observação";
    btnObservacao.style.backgroundColor = "";
    btnObservacao.style.borderColor = "";
    btnObservacao.style.color = "";

    // Remover o atributo data
    delete itemDiv.dataset.observacao;
  }

  // Ocultar o campo de observação
  observacaoDiv.style.display = "none";
}

// Função para cancelar uma observação
function cancelarObservacao(event) {
  const itemDiv = event.target.closest(".item");
  const observacaoDiv = itemDiv.querySelector(".item-observacao");

  // Ocultar o campo de observação sem salvar
  observacaoDiv.style.display = "none";
}

// Função para adicionar um item ao carrinho
function adicionarItem(event) {
  const itemDiv = event.target.closest(".item");

  if (!itemDiv) return;

  const id = itemDiv.dataset.id;
  const nome = itemDiv.dataset.nome;
  const valor = parseFloat(itemDiv.dataset.valor);
  const tipo = itemDiv.dataset.tipo;

  // Se for bebida ou porção, adiciona direto ao carrinho
  if (tipo === "bebida" || tipo === "porcao") {
    adicionarItemAoCarrinho(id, nome, valor, tipo, [], "");
    return;
  }

  // Sempre criar um novo item do zero
  carrinho.itemAtual = {
    idUnico: `${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    idOriginal: id,
    nome: nome,
    valor: valor,
    tipo: tipo,
    adicionais: [],
    observacao: "",
  };

  // Limpar o campo de observação visível, se existir
  const campoObs = itemDiv.querySelector(".observacao-texto");
  if (campoObs) {
    campoObs.value = "";
  }

  // Perguntar sobre adicionais
  mostrarPerguntaAdicionais(itemDiv, id, nome, valor, tipo);
}

// Função para adicionar um item ao carrinho (com ou sem adicionais, e com observações)
function adicionarItemAoCarrinho(
  id,
  nome,
  valor,
  tipo,
  adicionaisList = [],
  observacoes = ""
) {
  console.log("Adicionando ao carrinho:", nome, adicionaisList, observacoes);

  // Gerar um ID único para este item específico
  carrinho.contador++;
  const itemUniqueKey = `item_${carrinho.contador}`;

  // Calcular preço total dos adicionais
  let adicionaisTotal = 0;

  adicionaisList.forEach((adicional) => {
    adicionaisTotal += adicional.preco;
  });

  // Adicionar novo item ao carrinho
  carrinho.itens[itemUniqueKey] = {
    id,
    nome,
    valor,
    quantidade: 1,
    adicionais: adicionaisList,
    adicionaisTotal,
    observacoes,
    uniqueId: itemUniqueKey,
  };

  // Atualizar carrinho e total
  atualizarCarrinho();

  // Mostrar notificação de item adicionado
  mostrarNotificacao(`${nome} adicionado ao carrinho!`);
}

// Função para remover um item do carrinho
function removerItem(event) {
  const itemDiv = event.target.closest(".item");
  const id = itemDiv.dataset.id;

  // Atualizar quantidade na interface
  const qtySpan = itemDiv.querySelector(".item-qty");
  let quantidade = parseInt(qtySpan.textContent);

  if (quantidade > 0) {
    quantidade -= 1;
    qtySpan.textContent = quantidade;

    // Encontrar e remover o último item adicionado que corresponda ao id
    const itemsToRemove = [];
    for (const key in carrinho.itens) {
      const item = carrinho.itens[key];
      if (item.id === id) {
        itemsToRemove.push(key);
      }
    }

    if (itemsToRemove.length > 0) {
      // Remover o último item adicionado
      const itemToRemove = itemsToRemove[itemsToRemove.length - 1];
      const itemNome = carrinho.itens[itemToRemove].nome;
      delete carrinho.itens[itemToRemove];

      // Mostrar notificação de remoção
      mostrarNotificacao(`${itemNome} removido do carrinho`);
    }

    // Atualizar carrinho e total
    atualizarCarrinho();
  }
}

// Função para remover um item específico do carrinho (pelo botão X no carrinho)
function removerItemDoCarrinho(uniqueId) {
  if (carrinho.itens[uniqueId]) {
    const item = carrinho.itens[uniqueId];
    const id = item.id;
    const nome = item.nome;

    // Decrementar a quantidade exibida na interface
    const itemDivs = document.querySelectorAll(`.item[data-id="${id}"]`);
    itemDivs.forEach((itemDiv) => {
      const qtySpan = itemDiv.querySelector(".item-qty");
      let quantidade = parseInt(qtySpan.textContent);
      if (quantidade > 0) {
        quantidade -= 1;
        qtySpan.textContent = quantidade;
      }
    });

    // Remover item do carrinho
    delete carrinho.itens[uniqueId];

    // Mostrar notificação de item removido
    mostrarNotificacao(`${nome} removido do carrinho`);

    // Atualizar carrinho
    atualizarCarrinho();
  }
}

// Função para limpar todo o carrinho
function limparCarrinho() {
  // Verificar se há itens para limpar
  if (Object.keys(carrinho.itens).length > 0) {
    // Limpar todos os itens do carrinho
    carrinho.itens = {};
    carrinho.total = 0;

    // Resetar todas as quantidades na interface
    const qtySpans = document.querySelectorAll(".item-qty");
    qtySpans.forEach((span) => {
      span.textContent = "0";
    });

    // Mostrar notificação
    mostrarNotificacao("Carrinho limpo com sucesso!");

    // Atualizar a interface do carrinho
    atualizarCarrinho();

    // Não limpa o nome do cliente ao limpar o carrinho
  }
}

// Função para atualizar o contador do carrinho flutuante
function atualizarContadorCarrinho() {
  const contador = document.getElementById("carrinho-contador");
  if (!contador) return;

  // Contar quantos itens existem no carrinho
  const quantidadeItens = Object.keys(carrinho.itens).length;

  // Atualizar o texto do contador
  contador.textContent = quantidadeItens;

  // Mostrar ou esconder o contador baseado na quantidade
  if (quantidadeItens > 0) {
    contador.classList.add("mostrar");
  } else {
    contador.classList.remove("mostrar");
  }
}

// Função para atualizar o carrinho e o total
function atualizarCarrinho() {
  console.log("Atualizando carrinho:", carrinho);

  const itensCarrinho = document.getElementById("itens-carrinho");
  const valorTotal = document.getElementById("valorTotal");

  if (!itensCarrinho || !valorTotal) {
    console.error("Elementos do carrinho não encontrados");
    return;
  }

  // Limpar o conteúdo atual do carrinho
  itensCarrinho.innerHTML = "";

  // Calcular novo total
  let total = 0;
  let temItens = false;

  for (const itemKey in carrinho.itens) {
    const item = carrinho.itens[itemKey];
    temItens = true;

    // Calcular subtotal do item
    const valorItem = item.valor;
    const valorAdicionais = item.adicionaisTotal || 0;
    const subtotal = valorItem + valorAdicionais;

    // Adicionar ao total
    total += subtotal;

    // Criar elemento de item no carrinho
    const divItem = document.createElement("div");
    divItem.className = "cart-item";
    divItem.dataset.uniqueId = item.uniqueId;

    // Texto do item (com ou sem adicional)
    let itemNome = `${item.nome}`;
    let adicionaisHtml = "";
    let observacoesHtml = "";

    if (item.adicionais && item.adicionais.length > 0) {
      adicionaisHtml = '<div class="adicionais-list">';

      // Criar um mapa para contar ocorrências de cada adicional
      const adicionaisContagem = {};

      item.adicionais.forEach((adicional) => {
        if (!adicionaisContagem[adicional.id]) {
          adicionaisContagem[adicional.id] = {
            nome: adicional.nome,
            preco: adicional.preco,
            quantidade: 1,
          };
        } else {
          adicionaisContagem[adicional.id].quantidade++;
        }
      });

      // Gerar HTML para cada adicional com sua contagem
      for (const [id, info] of Object.entries(adicionaisContagem)) {
        adicionaisHtml += `<small class="adicional-item">
          <span class="adicional-badge">${info.quantidade}x</span> 
          ${info.nome} 
          <span class="adicional-preco">(R$ ${(
            info.preco * info.quantidade
          ).toFixed(2)})</span>
        </small>`;
      }

      adicionaisHtml += "</div>";
    }

    // Adicionar observações se existirem
    if (item.observacoes) {
      observacoesHtml = `<div class="observacoes-list">
        <small class="observacao"><span class="observacao-badge">Obs:</span> ${item.observacoes}</small>
      </div>`;
    }

    divItem.innerHTML = `
      <div class="cart-item-name">
        ${itemNome}
        ${adicionaisHtml}
        ${observacoesHtml}
      </div>
      <div class="cart-item-actions">
        <button type="button" class="btn-editar-item" data-item-id="${
          item.uniqueId
        }" title="Editar item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <div class="cart-item-price">R$ ${subtotal.toFixed(2)}</div>
        <button type="button" class="btn-remove-item" data-item-id="${
          item.uniqueId
        }">×</button>
      </div>
    `;

    itensCarrinho.appendChild(divItem);

    // Adicionar event listener ao botão de remover
    const btnRemover = divItem.querySelector(
      `.btn-remove-item[data-item-id="${item.uniqueId}"]`
    );
    if (btnRemover) {
      btnRemover.addEventListener("click", function () {
        removerItemDoCarrinho(item.uniqueId);
      });
    }

    // Adicionar event listener ao botão de editar
    const btnEditar = divItem.querySelector(
      `.btn-editar-item[data-item-id="${item.uniqueId}"]`
    );
    if (btnEditar) {
      btnEditar.addEventListener("click", function () {
        editarItemDoCarrinho(item.uniqueId);
      });
    }
  }

  // Mostrar mensagem se não houver itens
  if (!temItens) {
    itensCarrinho.innerHTML =
      '<p class="empty-cart">Seu carrinho está vazio</p>';
  }

  // Atualizar total
  carrinho.total = total;
  valorTotal.textContent = `R$ ${total.toFixed(2)}`;

  // Atualizar contador do carrinho flutuante
  atualizarContadorCarrinho();
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem) {
  // Remover notificação anterior se existir
  const notificacaoAnterior = document.querySelector(".notificacao");
  if (notificacaoAnterior) {
    notificacaoAnterior.remove();
  }

  // Criar elemento de notificação
  const notificacaoDiv = document.createElement("div");
  notificacaoDiv.className = "notificacao";
  notificacaoDiv.textContent = mensagem;

  // Adicionar ao body
  document.body.appendChild(notificacaoDiv);

  // Adicionar classe para animar a entrada
  setTimeout(() => {
    notificacaoDiv.classList.add("mostrar");
  }, 10);

  // Remover após alguns segundos
  setTimeout(() => {
    notificacaoDiv.classList.remove("mostrar");
    setTimeout(() => {
      notificacaoDiv.remove();
    }, 500);
  }, 3000);
}

// Função para alternar entre modo claro e escuro
function configurarAlternadorTema() {
  const botaoTema = document.getElementById("theme-toggle-btn");
  const body = document.body;

  // Verifica se há uma preferência salva no localStorage
  const temaAtual = localStorage.getItem("tema");

  // Aplica o tema salvo ou detecta a preferência do sistema
  if (temaAtual === "dark") {
    body.classList.add("dark-mode");
    botaoTema.textContent = "☀️ Modo Claro";
  } else if (temaAtual === "light") {
    body.classList.remove("dark-mode");
    botaoTema.textContent = "🌙 Modo Escuro";
  } else {
    // Verifica preferência do sistema
    const prefereEscuro = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefereEscuro) {
      body.classList.add("dark-mode");
      botaoTema.textContent = "☀️ Modo Claro";
      localStorage.setItem("tema", "dark");
    } else {
      localStorage.setItem("tema", "light");
    }
  }

  // Adiciona evento de clique ao botão para alternar o tema
  botaoTema.addEventListener("click", function () {
    if (body.classList.contains("dark-mode")) {
      body.classList.remove("dark-mode");
      botaoTema.textContent = "🌙 Modo Escuro";
      localStorage.setItem("tema", "light");
    } else {
      body.classList.add("dark-mode");
      botaoTema.textContent = "☀️ Modo Claro";
      localStorage.setItem("tema", "dark");
    }
  });
}

// Adicionar esta função para configurar os eventos dos botões no modal
function configurarBotoesModal() {
  console.log("Configurando botões do modal");

  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (!modalOverlay) {
    console.error("Modal não encontrado para configurar botões");
    return;
  }

  // Configurar botão de fechar
  const btnFechar = modalOverlay.querySelector(".btn-close-adicionais");
  if (btnFechar) {
    // Remover eventos anteriores para evitar duplicação
    btnFechar.replaceWith(btnFechar.cloneNode(true));
    const newBtnFechar = modalOverlay.querySelector(".btn-close-adicionais");

    // Adicionar novo evento
    newBtnFechar.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      console.log("Botão fechar clicado");
      fecharModalAdicionais();
    });
    console.log("Botão fechar configurado");
  } else {
    console.error("Botão fechar não encontrado no modal");
  }

  // Configurar botão confirmar
  const btnConfirmar = modalOverlay.querySelector(".btn-confirmar-adicionais");
  if (btnConfirmar) {
    // Remover eventos anteriores para evitar duplicação
    btnConfirmar.replaceWith(btnConfirmar.cloneNode(true));
    const newBtnConfirmar = modalOverlay.querySelector(
      ".btn-confirmar-adicionais"
    );

    // Adicionar novo evento
    newBtnConfirmar.addEventListener("click", function (event) {
      event.preventDefault();
      console.log("Botão confirmar clicado");
      confirmarAdicionais();
    });
    console.log("Botão confirmar configurado");
  } else {
    console.error("Botão confirmar não encontrado no modal");
  }
}

// Função para configurar os botões flutuantes
function configurarBotoesFlutuantes() {
  const btnIrCarrinho = document.getElementById("btn-ir-carrinho");
  const btnVoltarTopo = document.getElementById("btn-voltar-topo");
  const resumoPedido = document.getElementById("resumoPedido");

  // Verificar se os elementos existem
  if (!btnIrCarrinho || !btnVoltarTopo || !resumoPedido) {
    console.error("Elementos de navegação não encontrados");
    return;
  }

  // Função para rolar até o carrinho
  btnIrCarrinho.addEventListener("click", function () {
    // Encontrar a posição do carrinho
    const carrinhoPos =
      resumoPedido.getBoundingClientRect().top + window.pageYOffset;

    // Scroll suave até o carrinho
    window.scrollTo({
      top: carrinhoPos - 20, // Um pequeno offset para melhor visualização
      behavior: "smooth",
    });

    // Dar foco ao campo de nome do cliente
    const nomeCliente = document.getElementById("nomeCliente");
    if (nomeCliente) {
      setTimeout(() => nomeCliente.focus(), 500);
    }
  });

  // Função para voltar ao topo
  btnVoltarTopo.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Mostrar/esconder o botão de voltar ao topo conforme o scroll
  window.addEventListener("scroll", function () {
    if (window.pageYOffset > 300) {
      btnVoltarTopo.classList.add("visivel");
    } else {
      btnVoltarTopo.classList.remove("visivel");
    }
  });

  // Verificar estado inicial do scroll
  if (window.pageYOffset > 300) {
    btnVoltarTopo.classList.add("visivel");
  }
}

// Configurar botão de WhatsApp
function configurarBotaoWhatsApp() {
  const btnWhatsApp = document.getElementById("btnFinalizarWhatsapp");
  if (btnWhatsApp) {
    btnWhatsApp.addEventListener("click", enviarPedidoWhatsApp);
  }
}

// Função para enviar o pedido via WhatsApp
function enviarPedidoWhatsApp() {
  // Verificar se há itens no carrinho
  if (Object.keys(carrinho.itens).length === 0) {
    mostrarNotificacao(
      "Adicione itens ao carrinho antes de finalizar o pedido"
    );
    return;
  }

  // Verificar se o nome do cliente foi preenchido
  if (!carrinho.nomeCliente) {
    mostrarNotificacao("Por favor, informe seu nome");
    const nomeCliente = document.getElementById("nomeCliente");
    if (nomeCliente) {
      nomeCliente.focus();
    }
    return;
  }

  // Verificar se o endereço foi preenchido
  if (!carrinho.enderecoCliente) {
    mostrarNotificacao("Por favor, informe seu endereço de entrega");
    const enderecoCliente = document.getElementById("enderecoCliente");
    if (enderecoCliente) {
      enderecoCliente.focus();
    }
    return;
  }

  // Verificar se a forma de pagamento foi selecionada
  if (!carrinho.formaPagamento) {
    mostrarNotificacao("Por favor, selecione uma forma de pagamento");
    const formaPagamento = document.getElementById("formaPagamento");
    if (formaPagamento) {
      formaPagamento.focus();
    }
    return;
  }

  // Número do WhatsApp da hamburgueria (substitua pelo número correto)
  const numeroWhatsApp = "5543996114268";

  // Construir a mensagem
  let mensagem = `*NOVO PEDIDO - SPACE BURGUER*\n\n`;
  mensagem += `*Cliente:* ${carrinho.nomeCliente}\n`;
  mensagem += `*Endereço de Entrega:* ${carrinho.enderecoCliente}\n`;
  mensagem += `*Forma de Pagamento:* ${carrinho.formaPagamento}\n\n`;
  mensagem += `*ITENS DO PEDIDO:*\n`;

  // Adicionar cada item do carrinho
  let contador = 1;
  for (const itemId in carrinho.itens) {
    const item = carrinho.itens[itemId];
    const valorItem = item.valor;
    const valorAdicionais = item.adicionaisTotal || 0;
    const subtotal = valorItem + valorAdicionais;

    mensagem += `${contador}. *${item.nome}* - R$ ${valorItem.toFixed(2)}\n`;

    // Adicionar observações se houver
    if (item.observacoes) {
      mensagem += `   _Obs: ${item.observacoes}_\n`;
    }

    // Adicionar adicionais se houver
    if (item.adicionais && item.adicionais.length > 0) {
      // Criar um mapa para contar ocorrências de cada adicional
      const adicionaisContagem = {};

      item.adicionais.forEach((adicional) => {
        if (!adicionaisContagem[adicional.id]) {
          adicionaisContagem[adicional.id] = {
            nome: adicional.nome,
            preco: adicional.preco,
            quantidade: 1,
          };
        } else {
          adicionaisContagem[adicional.id].quantidade++;
        }
      });

      // Adicionar os adicionais à mensagem
      mensagem += `   *Adicionais:*\n`;
      for (const [id, info] of Object.entries(adicionaisContagem)) {
        mensagem += `   - ${info.quantidade}x ${info.nome} (R$ ${(
          info.preco * info.quantidade
        ).toFixed(2)})\n`;
      }

      // Adicionar o subtotal do item com adicionais
      mensagem += `   *Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
    }

    contador++;
  }

  // Adicionar o total do pedido
  mensagem += `\n*TOTAL DO PEDIDO: R$ ${carrinho.total.toFixed(2)}*\n\n`;
  mensagem += `Obrigado pelo seu pedido! Estamos processando e entraremos em contato em breve.`;

  // Codificar a mensagem para URL
  const mensagemCodificada = encodeURIComponent(mensagem);

  // Criar o link do WhatsApp
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;

  // Redirecionar para o WhatsApp
  window.open(urlWhatsApp, "_blank");

  // Mostrar notificação de sucesso
  mostrarNotificacao("Redirecionando para o WhatsApp...");
}

// Função para configurar os campos de observação para todos os itens (hamburgueres e combos)
function configurarCamposObservacao() {
  // Obter todos os itens do tipo hamburger e combo
  const itemsParaObservacao = document.querySelectorAll(
    '.item[data-tipo="hamburguer"], .item[data-tipo="combo"]'
  );

  itemsParaObservacao.forEach((item) => {
    // Verificar se já tem campo de observação
    let observacaoDiv = item.querySelector(".item-observacao");
    if (!observacaoDiv) {
      // Se não existe, criar o campo de observação
      observacaoDiv = document.createElement("div");
      observacaoDiv.className = "item-observacao";
      observacaoDiv.style.display = "none";
      observacaoDiv.innerHTML = `
        <textarea placeholder="Ex: retirar tomate, sem cebola, etc." class="observacao-texto"></textarea>
        <div class="observacao-botoes">
          <button type="button" class="btn-confirmar-obs">Confirmar</button>
          <button type="button" class="btn-cancelar-obs">Cancelar</button>
        </div>
      `;

      // Adicionar ao item após os botões de ação
      const itemActions = item.querySelector(".item-actions");
      if (itemActions) {
        itemActions.insertAdjacentElement("afterend", observacaoDiv);
      }
    }

    // Verificar se tem seletor de adicionais
    let adicionalSelector = item.querySelector(".adicional-selector");
    if (!adicionalSelector) {
      // Se não existe, criar o seletor de adicionais
      adicionalSelector = document.createElement("div");
      adicionalSelector.className = "adicional-selector";
      adicionalSelector.style.display = "none";
      adicionalSelector.innerHTML = `
        <select>
          <option value="">Selecione um adicional (opcional)</option>
        </select>
      `;

      // Adicionar ao item após o campo de observação ou após os botões de ação
      if (observacaoDiv) {
        observacaoDiv.insertAdjacentElement("afterend", adicionalSelector);
      } else {
        const itemActions = item.querySelector(".item-actions");
        if (itemActions) {
          itemActions.insertAdjacentElement("afterend", adicionalSelector);
        }
      }
    }
  });

  // Configurar os botões de observação após criar os elementos
  adicionarBotoesObservacao();
}
