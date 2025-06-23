//*Preços dos adicionais
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
  catupiry: { nome: "Catupiry", preco: 8.0 },
  doritos: { nome: "Doritos", preco: 5.0 },
};

// *NOVO: Taxas de Entrega por Bairro
const taxasDeEntrega = {
  "Anita Moreira": 8.0,
  "Centro": 6.0,
  "Parque Bela Vista": 6.0,
  "Nova Jacarezinho": 8.0,
  "Vila Setti": 8.0,
  "Vila Silas": 7.0,
  "Vila São Pedro": 7.0,
  "Vila Maria": 8.0,
  "Vila Esperança": 8.0,
  "Vila Rondon": 7.0,
  "Villa Aggeu": 8.0,
  "Residencial Pompeia I, II, III ": 8.0,
  "Jardim Miguel Afonso": 7.0,
  "Jardim Scylla Peixoto": 8.0,
  "Jardim Alves": 7.0,
  "Jardim América": 7.0,
  "Jardim Castro": 8.0,
  "Jardim Europa": 7.0,
  "Jardim Canada": 7.0,
  "Jardim Panorama": 10.0,
  "Jardim Morada do Sol": 8.0,
  "Dom Pedro Filipack": 7.0,
  "Bairro Aeroporto": 12.0,
  "Bairro Estação": 10.0,
  "Vila Leão": 10.0,
  "Parque dos Mirantes": 7.0,
  "Novo Aeroporto": 14.0,
  "Jardim São Luis I, II": 8.0,
  "Papagaio": 8.0,
  "Outro Bairro (Consultar)": 0, // Valor 0 para indicar que precisa de consulta
};
// FIM NOVO

// Armazenar itens do carrinho
const carrinho = {
  itens: {},
  total: 0,
  contador: 0,
  itemAtual: null,
  nomeCliente: "",
  enderecoCliente: "",
  formaPagamento: "",
  // NOVAS PROPRIEDADES
  tipoServico: "entrega", // Valor padrão
  bairroSelecionado: "",
  taxaEntrega: 0,
  // FIM NOVAS PROPRIEDADES
};

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  console.log("Documento carregado!");

  criarModalAdicionais();
  configurarCamposObservacao();
  adicionarBotoesObservacao();

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

  const botoesObservacao = document.querySelectorAll(".btn-observacao");
  botoesObservacao.forEach((botao) => {
    botao.addEventListener("click", mostrarCampoObservacao);
  });

  const btnLimparCarrinho = document.getElementById("btnLimparCarrinho");
  if (btnLimparCarrinho) {
    btnLimparCarrinho.addEventListener("click", limparCarrinho);
  }

  configurarPesquisa();

  // NOVO: Referências para os elementos de tipo de serviço e entrega
  const radioEntrega = document.getElementById("tipoServicoEntrega");
  const radioRetirada = document.getElementById("tipoServicoRetirada");
  const camposEntregaDiv = document.getElementById("camposEntrega");
  const bairroSelect = document.getElementById("bairroSelect");
  const taxaEntregaInfoDiv = document.getElementById("taxaEntregaInfo");
  const enderecoClienteInput = document.getElementById("enderecoCliente");

  // NOVO: Popular o select de bairros
  if (bairroSelect) {
    // Adiciona uma opção padrão "Selecione o bairro" que não está em taxasDeEntrega
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecione o bairro";
    bairroSelect.appendChild(defaultOption);

    for (const bairro in taxasDeEntrega) {
      const option = document.createElement("option");
      option.value = bairro;
      option.textContent = bairro;
      bairroSelect.appendChild(option);
    }
  }

  // NOVO: Função para gerenciar a visibilidade dos campos de entrega
  function gerenciarCamposEntrega() {
    if (radioEntrega.checked) {
      camposEntregaDiv.style.display = "block";
      carrinho.tipoServico = "entrega";
      // Força a atualização da taxa caso um bairro já estivesse selecionado ao mudar para entrega
      atualizarTaxaSelecionada();
    } else {
      camposEntregaDiv.style.display = "none";
      carrinho.tipoServico = "retirada";
      carrinho.bairroSelecionado = ""; // Limpa bairro ao mudar para retirada
      carrinho.taxaEntrega = 0; // Zera taxa ao mudar para retirada
      taxaEntregaInfoDiv.textContent = "";
    }
    atualizarCarrinho();
  }

  // NOVO: Função para atualizar a taxa de entrega com base no bairro selecionado
  function atualizarTaxaSelecionada() {
    const bairro = bairroSelect.value;
    if (bairro && carrinho.tipoServico === "entrega") {
      carrinho.bairroSelecionado = bairro;
      carrinho.taxaEntrega = taxasDeEntrega[bairro] || 0; // Pega a taxa ou 0 se não encontrar

      if (taxasDeEntrega[bairro] !== undefined) {
        if (bairro === "Outro Bairro (Consultar)") {
          taxaEntregaInfoDiv.textContent = "Taxa: A consultar";
        } else {
          taxaEntregaInfoDiv.textContent = `Taxa de Entrega: R$ ${carrinho.taxaEntrega.toFixed(
            2
          )}`;
        }
      } else {
        // Isso não deveria acontecer se o select só tiver bairros válidos, mas é uma salvaguarda
        taxaEntregaInfoDiv.textContent = "Bairro inválido";
        carrinho.taxaEntrega = 0;
      }
    } else if (carrinho.tipoServico === "retirada") {
      carrinho.bairroSelecionado = "";
      carrinho.taxaEntrega = 0;
      taxaEntregaInfoDiv.textContent = "";
    } else {
      // Caso "Selecione o bairro" ou tipo de serviço não seja entrega e o valor do select seja ""
      carrinho.bairroSelecionado = "";
      carrinho.taxaEntrega = 0;
      if (carrinho.tipoServico === "entrega") {
        taxaEntregaInfoDiv.textContent = "Selecione um bairro para ver a taxa.";
      } else {
        taxaEntregaInfoDiv.textContent = "";
      }
    }
    atualizarCarrinho();
  }

  // NOVO: Event listeners para os radio buttons e select de bairro
  if (radioEntrega)
    radioEntrega.addEventListener("change", gerenciarCamposEntrega);
  if (radioRetirada)
    radioRetirada.addEventListener("change", gerenciarCamposEntrega);
  if (bairroSelect)
    bairroSelect.addEventListener("change", atualizarTaxaSelecionada);

  const nomeClienteInput = document.getElementById("nomeCliente");
  if (nomeClienteInput) {
    nomeClienteInput.addEventListener("input", function () {
      carrinho.nomeCliente = this.value.trim();
      localStorage.setItem("nomeCliente", carrinho.nomeCliente);
    });
    const nomeSalvo = localStorage.getItem("nomeCliente");
    if (nomeSalvo) {
      nomeClienteInput.value = nomeSalvo;
      carrinho.nomeCliente = nomeSalvo;
    }
  }

  if (enderecoClienteInput) {
    enderecoClienteInput.addEventListener("input", function () {
      carrinho.enderecoCliente = this.value.trim();
      localStorage.setItem("enderecoCliente", carrinho.enderecoCliente);
    });
    const enderecoSalvo = localStorage.getItem("enderecoCliente");
    if (enderecoSalvo) {
      enderecoClienteInput.value = enderecoSalvo;
      carrinho.enderecoCliente = enderecoSalvo;
    }
  }

  const formaPagamentoSelect = document.getElementById("formaPagamento");
  if (formaPagamentoSelect) {
    formaPagamentoSelect.addEventListener("change", function () {
      carrinho.formaPagamento = this.value;
      if (this.value) {
        localStorage.setItem("formaPagamento", this.value);
      }
    });
    const formaPagamentoSalva = localStorage.getItem("formaPagamento");
    if (formaPagamentoSalva) {
      formaPagamentoSelect.value = formaPagamentoSalva;
      carrinho.formaPagamento = formaPagamentoSalva;
    }
  }

  // NOVO: Carregar dados do localStorage para tipo de serviço e bairro
  const tipoServicoSalvo = localStorage.getItem("tipoServico");
  if (tipoServicoSalvo) {
    if (tipoServicoSalvo === "retirada") {
      radioRetirada.checked = true;
    } else {
      radioEntrega.checked = true;
    }
    carrinho.tipoServico = tipoServicoSalvo;
  }

  const bairroSalvo = localStorage.getItem("bairroSelecionado");
  if (bairroSalvo && carrinho.tipoServico === "entrega") {
    // Verifica se o bairro salvo ainda existe nas opções do select
    const existeOpcao = Array.from(bairroSelect.options).some(
      (opt) => opt.value === bairroSalvo
    );
    if (existeOpcao) {
      bairroSelect.value = bairroSalvo;
      carrinho.bairroSelecionado = bairroSalvo;
    } else {
      // Se o bairro salvo não existe mais (ex: removido da lista), reseta
      bairroSelect.value = "";
      carrinho.bairroSelecionado = "";
      localStorage.removeItem("bairroSelecionado");
    }
  }

  // Chamar inicialmente para configurar o estado correto dos campos e taxa
  gerenciarCamposEntrega();
  if (carrinho.tipoServico === "entrega" && carrinho.bairroSelecionado) {
    atualizarTaxaSelecionada();
  } else if (
    carrinho.tipoServico === "entrega" &&
    !carrinho.bairroSelecionado
  ) {
    // Se for entrega e não houver bairro salvo, garantir que a taxa e info estejam limpas
    taxaEntregaInfoDiv.textContent = "Selecione um bairro para ver a taxa.";
    carrinho.taxaEntrega = 0;
  }
  atualizarCarrinho(); // Atualiza o total ao carregar a página
  // FIM NOVO

  configurarAlternadorTema();
  configurarBotoesFlutuantes();
  configurarBotaoWhatsApp();
});
// FIM DO DOMContentLoaded

// Função para adicionar botões de observação a todos os itens
function adicionarBotoesObservacao() {
  const itens = document.querySelectorAll(
    '.item[data-tipo="hamburguer"], .item[data-tipo="combo"]'
  );
  itens.forEach((item) => {
    if (!item.querySelector(".item-observacao")) {
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
          
          
        </div>
        <div class="observacao-botoes">
          <button type="button" class="btn-confirmar-obs">Confirmar</button>
          <button type="button" class="btn-cancelar-obs">Cancelar</button>
        </div>
      `;
      const itemActions = item.querySelector(".item-actions");
      if (itemActions) {
        itemActions.insertAdjacentElement("afterend", observacaoDiv);
      }
      observacaoDiv.querySelectorAll(".opcao-rapida").forEach((opcao) => {
        opcao.addEventListener("click", function () {
          const texto = this.dataset.texto;
          const textarea = observacaoDiv.querySelector("textarea");
          textarea.value += textarea.value ? ", " + texto : texto;
        });
      });
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

function configurarPesquisa() {
  const pesquisaInput = document.getElementById("pesquisaInput");
  const btnPesquisar = document.getElementById("btnPesquisar");
  const searchResultsCount = document.getElementById("searchResultsCount");

  function realizarPesquisa() {
    const termoPesquisa = pesquisaInput.value.trim().toLowerCase();
    if (termoPesquisa.length < 2) {
      document.querySelectorAll(".item").forEach((item) => {
        item.classList.remove("destaque");
        item.style.display = "";
      });
      document.querySelectorAll("section").forEach((section) => {
        section.style.display = "";
      });
      searchResultsCount.textContent = "";
      return;
    }
    let itensEncontrados = 0;
    const sections = document.querySelectorAll("section");
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
      section.style.display = itensVisiveis > 0 ? "" : "none";
    });
    if (itensEncontrados === 0) {
      searchResultsCount.textContent = "Nenhum item encontrado";
    } else {
      searchResultsCount.textContent = `${itensEncontrados} ${
        itensEncontrados === 1 ? "item encontrado" : "itens encontrados"
      }`;
    }
    const primeiroEncontrado = document.querySelector(".destaque");
    if (primeiroEncontrado) {
      primeiroEncontrado.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }
  btnPesquisar.addEventListener("click", realizarPesquisa);
  pesquisaInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      realizarPesquisa();
    } else if (e.key === "Escape") {
      pesquisaInput.value = "";
      realizarPesquisa();
    } else if (pesquisaInput.value.trim().length >= 2) {
      setTimeout(realizarPesquisa, 300);
    }
  });
  pesquisaInput.addEventListener("input", () => {
    if (pesquisaInput.value.trim() === "") {
      realizarPesquisa();
    }
  });
  pesquisaInput.addEventListener("search", realizarPesquisa);
}

function criarModalAdicionais() {
  if (document.querySelector(".adicionais-modal-overlay")) {
    return;
  }
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "adicionais-modal-overlay";
  const adicionaisContainer = document.createElement("div");
  adicionaisContainer.className = "adicionais-container";
  modalOverlay.appendChild(adicionaisContainer);
  const titulo = document.createElement("h3");
  titulo.textContent = "Escolha seus adicionais:";
  titulo.style.paddingRight = "40px";
  adicionaisContainer.appendChild(titulo);
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close-adicionais";
  closeButton.innerHTML = "×";
  closeButton.style.cssText =
    "position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background-color:#f44336;color:white;font-size:24px;font-weight:bold;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;border:none;";
  closeButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    fecharModalAdicionais();
  });
  adicionaisContainer.appendChild(closeButton);
  const adicionaisList = document.createElement("div");
  adicionaisList.className = "adicionais-list-select";
  adicionaisContainer.appendChild(adicionaisList);
  for (const [key, adicional] of Object.entries(adicionais)) {
    const adicionalItem = document.createElement("div");
    adicionalItem.className = "adicional-item";
    adicionalItem.dataset.id = key;
    adicionalItem.style.border = "1px solid #ff5722";
    adicionalItem.style.marginBottom = "10px";
    const adicionalInfo = document.createElement("div");
    adicionalInfo.className = "adicional-info";
    const adicionalNome = document.createElement("span");
    adicionalNome.className = "adicional-nome";
    adicionalNome.textContent = adicional.nome;
    adicionalNome.style.cssText = "font-weight:bold;font-size:16px;color:#333;";
    adicionalInfo.appendChild(adicionalNome);
    const adicionalPreco = document.createElement("span");
    adicionalPreco.className = "adicional-preco";
    adicionalPreco.textContent = `R$ ${adicional.preco.toFixed(2)}`;
    adicionalPreco.style.cssText = "font-weight:bold;color:#ff5722;";
    adicionalInfo.appendChild(adicionalPreco);
    const quantidadeControle = document.createElement("div");
    quantidadeControle.className = "quantidade-controle";
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
    const qtySpan = document.createElement("span");
    qtySpan.className = "adicional-qty";
    qtySpan.dataset.id = key;
    qtySpan.textContent = "0";
    quantidadeControle.appendChild(qtySpan);
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
    </div>`;
  adicionaisContainer.appendChild(observacoesDiv);
  observacoesDiv.querySelectorAll(".opcao-rapida").forEach((opcao) => {
    opcao.addEventListener("click", function () {
      const texto = this.dataset.texto;
      const textarea = document.getElementById("observacoes-pedido");
      textarea.value += textarea.value ? ", " + texto : texto;
      this.classList.add("selecionado");
      setTimeout(() => this.classList.remove("selecionado"), 500);
    });
  });
  const selecionadosDiv = document.createElement("div");
  selecionadosDiv.className = "adicionais-selecionados";
  selecionadosDiv.innerHTML = "<p>Adicionais selecionados:</p><ul></ul>";
  adicionaisContainer.appendChild(selecionadosDiv);
  const btnConfirmar = document.createElement("button");
  btnConfirmar.type = "button";
  btnConfirmar.className = "btn-confirmar-adicionais";
  btnConfirmar.textContent = "Confirmar";
  btnConfirmar.addEventListener("click", function (event) {
    event.preventDefault();
    confirmarAdicionais();
  });
  adicionaisContainer.appendChild(btnConfirmar);
  document.body.appendChild(modalOverlay);
}

function atualizarResumoAdicionais() {
  const selecionadosDiv = document.querySelector(".adicionais-selecionados");
  const selecionadosLista = selecionadosDiv.querySelector("ul");
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  const qtySpans = modalOverlay.querySelectorAll(".adicional-qty");
  selecionadosLista.innerHTML = "";
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
      if (!adicional) return;
      const subtotal = adicional.preco * quantidade;
      totalAdicionais += subtotal;
      const li = document.createElement("li");
      li.style.cssText =
        "padding:8px;margin-bottom:8px;background-color:#fff;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1);";
      li.dataset.id = adicionalId;
      const itemDiv = document.createElement("div");
      itemDiv.className = "adicional-resumo";
      itemDiv.style.cssText =
        "display:flex;align-items:center;gap:10px;position:relative;";
      const qtySpanResumo = document.createElement("span"); // Renomeado para evitar conflito
      qtySpanResumo.className = "adicional-resumo-quantidade";
      qtySpanResumo.textContent = `${quantidade}x`;
      qtySpanResumo.style.cssText =
        "background-color:#ffebee;color:#e53935;border-radius:12px;padding:2px 8px;font-weight:bold;";
      itemDiv.appendChild(qtySpanResumo);
      const nomeSpan = document.createElement("span");
      nomeSpan.className = "adicional-resumo-nome";
      nomeSpan.textContent = adicional.nome;
      nomeSpan.style.cssText = "flex:1;font-weight:600;";
      itemDiv.appendChild(nomeSpan);
      const precoSpan = document.createElement("span");
      precoSpan.className = "adicional-resumo-preco";
      precoSpan.textContent = `R$ ${subtotal.toFixed(2)}`;
      precoSpan.style.cssText = "color:#ff5722;font-weight:700;";
      itemDiv.appendChild(precoSpan);
      const btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.className = "btn-remover-adicional";
      btnRemover.textContent = "×";
      btnRemover.style.cssText =
        "background-color:#f44336;color:white;border:none;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;cursor:pointer;margin-left:5px;";
      btnRemover.addEventListener("click", function () {
        const qtySpanOriginal = modalOverlay.querySelector(
          // Renomeado para evitar conflito
          `.adicional-qty[data-id="${adicionalId}"]`
        );
        if (qtySpanOriginal) {
          qtySpanOriginal.textContent = "0";
          atualizarResumoAdicionais();
        }
      });
      itemDiv.appendChild(btnRemover);
      li.appendChild(itemDiv);
      selecionadosLista.appendChild(li);
    }
  });
  selecionadosDiv.style.display = temSelecionados ? "block" : "none";
  if (temSelecionados) {
    selecionadosDiv.querySelector(
      "p"
    ).textContent = `Adicionais selecionados (${totalItens} ${
      totalItens === 1 ? "item" : "itens"
    }):`;
    const totalLi = document.createElement("li");
    totalLi.className = "adicionais-total";
    totalLi.style.cssText =
      "margin-top:10px;padding-top:8px;border-top:1px dashed #ffccbc;";
    const totalDiv = document.createElement("div");
    totalDiv.className = "adicional-resumo-total";
    totalDiv.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;font-weight:700;";
    const labelSpan = document.createElement("span");
    labelSpan.textContent = "Total dos adicionais:";
    totalDiv.appendChild(labelSpan);
    const valorSpan = document.createElement("span");
    valorSpan.className = "adicional-resumo-valor";
    valorSpan.textContent = `R$ ${totalAdicionais.toFixed(2)}`;
    valorSpan.style.cssText = "color:#ff5722;font-size:1.1rem;";
    totalDiv.appendChild(valorSpan);
    totalLi.appendChild(totalDiv);
    selecionadosLista.appendChild(totalLi);
  }
}

function mostrarPerguntaAdicionais(
  itemDiv,
  id,
  nome,
  valor,
  tipo,
  observacao = ""
) {
  if (tipo !== "hamburguer" && tipo !== "combo") {
    adicionarItemAoCarrinho(id, nome, valor, tipo, [], observacao);
    return;
  }
  const perguntaAnterior = itemDiv.querySelector(".pergunta-adicionais");
  if (perguntaAnterior) {
    perguntaAnterior.remove();
  }
  let perguntaTexto =
    tipo === "combo"
      ? "Deseja personalizar ou adicionar observações ao combo?"
      : "Deseja adicionais ou alguma observação?";
  let btnNaoTexto =
    tipo === "combo" ? "Sem personalização" : "Sem adicionais/observações";
  let btnSimTexto = tipo === "combo" ? "Personalizar combo" : "Personalizar";
  const perguntaDiv = document.createElement("div");
  perguntaDiv.className = "pergunta-adicionais";
  perguntaDiv.innerHTML = `<p>${perguntaTexto}</p><div class="pergunta-botoes"><button type="button" class="btn-nao">${btnNaoTexto}</button><button type="button" class="btn-sim">${btnSimTexto}</button></div>`;
  const itemActions = itemDiv.querySelector(".item-actions");
  itemActions.insertAdjacentElement("afterend", perguntaDiv);
  const btnNao = perguntaDiv.querySelector(".btn-nao");
  const btnSim = perguntaDiv.querySelector(".btn-sim");
  btnNao.addEventListener("click", function () {
    perguntaDiv.remove();
    adicionarItemAoCarrinho(id, nome, valor, tipo, [], observacao);
  });
  btnSim.addEventListener("click", function () {
    perguntaDiv.remove();
    abrirModalAdicionais(itemDiv, id, nome, valor, tipo, observacao);
  });
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      perguntaDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }
}

function abrirModalAdicionais(itemDiv, id, nome, valor, tipo, observacao = "") {
  carrinho.itemAtual = { itemDiv, id, nome, valor, tipo, observacao };
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (!modalOverlay) {
    criarModalAdicionais();
    return abrirModalAdicionais(itemDiv, id, nome, valor, tipo, observacao);
  }
  const qtySpans = modalOverlay.querySelectorAll(".adicional-qty");
  qtySpans.forEach((span) => (span.textContent = "0"));
  const observacoesInput = document.getElementById("observacoes-pedido");
  if (observacoesInput) observacoesInput.value = observacao;
  const selecionadosDiv = modalOverlay.querySelector(
    ".adicionais-selecionados"
  );
  if (selecionadosDiv) selecionadosDiv.style.display = "none";
  let tituloTexto =
    tipo === "combo"
      ? `Personalizar Combo: ${nome}`
      : `Adicionais e Observações: ${nome}`;
  let observacaoPlaceholder =
    tipo === "combo"
      ? "Deseja adicionar alguma observação ao combo?"
      : "Deseja adicionar alguma observação?";
  let btnTexto =
    tipo === "combo"
      ? "Confirmar Personalização"
      : "Confirmar e Adicionar ao Carrinho";
  const tituloModal = modalOverlay.querySelector("h3");
  if (tituloModal) {
    tituloModal.textContent = tituloTexto;
    tituloModal.style.cssText =
      "color:#ff5722;font-size:18px;font-weight:bold;text-align:center;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #ff5722;padding-right:40px;";
  }
  const observacoesContainerH4 = modalOverlay.querySelector(
    ".observacoes-container h4"
  ); // Corrigido
  if (observacoesContainerH4) {
    observacoesContainerH4.textContent = observacaoPlaceholder;
    observacoesContainerH4.style.cssText =
      "font-size:16px;font-weight:bold;margin-bottom:10px;";
  }
  const btnConfirmar = modalOverlay.querySelector(".btn-confirmar-adicionais");
  if (btnConfirmar) {
    btnConfirmar.textContent = btnTexto;
    btnConfirmar.style.cssText =
      "background-color:#ff5722;color:#fff;padding:15px;font-size:16px;font-weight:bold;border-radius:8px;margin-top:15px;cursor:pointer;";
    btnConfirmar.onclick = function (event) {
      event.preventDefault();
      confirmarAdicionais();
    };
  }
  const btnFechar = modalOverlay.querySelector(".btn-close-adicionais");
  if (btnFechar) {
    btnFechar.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      fecharModalAdicionais();
    };
  }
  configurarBotoesModal();
  modalOverlay.classList.add("show");
  modalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharModalAdicionais() {
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (modalOverlay) {
    modalOverlay.classList.remove("show");
    modalOverlay.style.display = "none";
    document.body.style.overflow = "";
    carrinho.itemAtual = null;
  }
}

function editarItemDoCarrinho(uniqueId) {
  const item = carrinho.itens[uniqueId];
  if (!item) return;
  const itemDiv = document.querySelector(`.item[data-id="${item.id}"]`);
  if (!itemDiv) return;
  carrinho.itemAtual = {
    itemDiv,
    id: item.id,
    nome: item.nome,
    valor: item.valor,
    tipo: item.tipo,
    observacao: item.observacoes || "",
    uniqueId: uniqueId,
  };
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (!modalOverlay) criarModalAdicionais();
  const qtySpans = modalOverlay.querySelectorAll(".adicional-qty");
  qtySpans.forEach((span) => (span.textContent = "0"));
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
  const observacoesInput = document.getElementById("observacoes-pedido");
  if (observacoesInput) observacoesInput.value = item.observacoes || "";
  const tituloModal = modalOverlay.querySelector("h3");
  if (tituloModal) tituloModal.textContent = `Editando: ${item.nome}`;
  atualizarResumoAdicionais();
  modalOverlay.classList.add("show");
  modalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
  configurarBotoesModal();
}

function confirmarAdicionais() {
  if (!carrinho.itemAtual) return;
  const { id, nome, valor, tipo, observacao, uniqueId } = carrinho.itemAtual;
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (!modalOverlay) return;
  const qtySpans = modalOverlay.querySelectorAll(".adicional-qty");
  const adicionaisSelecionados = [];
  qtySpans.forEach((span) => {
    const quantidade = parseInt(span.textContent);
    if (quantidade > 0) {
      const adicionalId = span.dataset.id;
      const adicional = adicionais[adicionalId];
      if (!adicional) return;
      for (let i = 0; i < quantidade; i++) {
        adicionaisSelecionados.push({
          id: adicionalId,
          nome: adicional.nome,
          preco: adicional.preco,
        });
      }
    }
  });
  const observacoesInput = document.getElementById("observacoes-pedido");
  const observacaoAtualizada = observacoesInput
    ? observacoesInput.value.trim()
    : observacao;
  let adicionaisTotal = 0;
  adicionaisSelecionados.forEach((ad) => (adicionaisTotal += ad.preco)); // Corrigido: 'ad' em vez de 'adicional'
  if (uniqueId) {
    carrinho.itens[uniqueId] = {
      ...carrinho.itens[uniqueId],
      adicionais: adicionaisSelecionados,
      adicionaisTotal,
      observacoes: observacaoAtualizada,
    };
  } else {
    adicionarItemAoCarrinho(
      id,
      nome,
      valor,
      tipo,
      adicionaisSelecionados,
      observacaoAtualizada
    );
  }
  mostrarNotificacao(
    `${nome} ${uniqueId ? "atualizado" : "adicionado"} ao carrinho!`
  );
  modalOverlay.classList.remove("show");
  modalOverlay.style.display = "none";
  document.body.style.overflow = "";
  carrinho.itemAtual = null;
  atualizarCarrinho();
}

function mostrarCampoObservacao(event) {
  const itemDiv = event.target.closest(".item");
  const observacaoDiv = itemDiv.querySelector(".item-observacao");
  if (observacaoDiv) {
    observacaoDiv.style.display = "block";
    const textarea = observacaoDiv.querySelector("textarea");
    textarea.focus();
    const btnConfirmar = observacaoDiv.querySelector(".btn-confirmar-obs");
    const btnCancelar = observacaoDiv.querySelector(".btn-cancelar-obs");
    btnConfirmar.removeEventListener("click", confirmarObservacao);
    btnCancelar.removeEventListener("click", cancelarObservacao);
    btnConfirmar.addEventListener("click", confirmarObservacao);
    btnCancelar.addEventListener("click", cancelarObservacao);
  }
}

function confirmarObservacao(event) {
  const itemDiv = event.target.closest(".item");
  const observacaoDiv = itemDiv.querySelector(".item-observacao");
  const textarea = observacaoDiv.querySelector("textarea");
  const btnObservacao = itemDiv.querySelector(".btn-observacao");
  const observacao = textarea.value.trim();
  if (observacao) {
    btnObservacao.textContent = "Observação adicionada ✓";
    btnObservacao.style.cssText =
      "background-color:#e8f5e9;border-color:#a5d6a7;color:#388e3c;";
    itemDiv.dataset.observacao = observacao;
  } else {
    btnObservacao.textContent = "Adicionar observação";
    btnObservacao.style.cssText = "";
    delete itemDiv.dataset.observacao;
  }
  observacaoDiv.style.display = "none";
}

function cancelarObservacao(event) {
  const itemDiv = event.target.closest(".item");
  const observacaoDiv = itemDiv.querySelector(".item-observacao");
  observacaoDiv.style.display = "none";
}

function adicionarItem(event) {
  const itemDiv = event.target.closest(".item");
  if (!itemDiv) return;
  const id = itemDiv.dataset.id;
  const nome = itemDiv.dataset.nome;
  const valor = parseFloat(itemDiv.dataset.valor);
  const tipo = itemDiv.dataset.tipo;
  if (tipo === "bebida" || tipo === "porcao") {
    adicionarItemAoCarrinho(id, nome, valor, tipo, [], "");
    return;
  }
  carrinho.itemAtual = {
    idUnico: `${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    idOriginal: id,
    nome: nome,
    valor: valor,
    tipo: tipo,
    adicionais: [],
    observacao: "",
  };
  const campoObs = itemDiv.querySelector(".observacao-texto");
  if (campoObs) campoObs.value = "";
  mostrarPerguntaAdicionais(itemDiv, id, nome, valor, tipo);
}

function adicionarItemAoCarrinho(
  id,
  nome,
  valor,
  tipo,
  adicionaisList = [],
  observacoes = ""
) {
  carrinho.contador++;
  const itemUniqueKey = `item_${carrinho.contador}`;
  let adicionaisTotal = 0;
  adicionaisList.forEach((adicional) => (adicionaisTotal += adicional.preco));
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
  atualizarCarrinho();
  mostrarNotificacao(`${nome} adicionado ao carrinho!`);
}

function removerItem(event) {
  const itemDiv = event.target.closest(".item");
  const id = itemDiv.dataset.id;
  const qtySpan = itemDiv.querySelector(".item-qty");
  let quantidade = parseInt(qtySpan.textContent);
  if (quantidade > 0) {
    quantidade -= 1;
    qtySpan.textContent = quantidade;
    const itemsToRemove = [];
    for (const key in carrinho.itens) {
      if (carrinho.itens[key].id === id) {
        // Modificado para verificar carrinho.itens[key].id
        itemsToRemove.push(key);
      }
    }
    if (itemsToRemove.length > 0) {
      const itemToRemove = itemsToRemove[itemsToRemove.length - 1];
      const itemNome = carrinho.itens[itemToRemove].nome;
      delete carrinho.itens[itemToRemove];
      mostrarNotificacao(`${itemNome} removido do carrinho`);
    }
    atualizarCarrinho();
  }
}

function removerItemDoCarrinho(uniqueId) {
  if (carrinho.itens[uniqueId]) {
    const item = carrinho.itens[uniqueId];
    const id = item.id;
    const nome = item.nome;
    const itemDivs = document.querySelectorAll(`.item[data-id="${id}"]`);
    itemDivs.forEach((itemDiv) => {
      const qtySpan = itemDiv.querySelector(".item-qty");
      let quantidade = parseInt(qtySpan.textContent);
      if (quantidade > 0) {
        quantidade -= 1;
        qtySpan.textContent = quantidade;
      }
    });
    delete carrinho.itens[uniqueId];
    mostrarNotificacao(`${nome} removido do carrinho`);
    atualizarCarrinho();
  }
}

function limparCarrinho() {
  if (Object.keys(carrinho.itens).length > 0) {
    carrinho.itens = {};
    // MODIFICADO: Resetar informações de entrega/retirada
    carrinho.tipoServico = "entrega";
    const radioEntrega = document.getElementById("tipoServicoEntrega");
    if (radioEntrega) radioEntrega.checked = true;

    const camposEntregaDiv = document.getElementById("camposEntrega");
    if (camposEntregaDiv) camposEntregaDiv.style.display = "block";

    carrinho.bairroSelecionado = "";
    const bairroSelect = document.getElementById("bairroSelect");
    if (bairroSelect) bairroSelect.value = "";

    carrinho.taxaEntrega = 0;
    const taxaEntregaInfoDiv = document.getElementById("taxaEntregaInfo");
    if (taxaEntregaInfoDiv) taxaEntregaInfoDiv.textContent = "";
    // FIM MODIFICADO

    const qtySpans = document.querySelectorAll(".item-qty");
    qtySpans.forEach((span) => (span.textContent = "0"));
    mostrarNotificacao("Carrinho limpo com sucesso!");
    atualizarCarrinho();
  }
}

function atualizarContadorCarrinho() {
  const contador = document.getElementById("carrinho-contador");
  if (!contador) return;
  const quantidadeItens = Object.keys(carrinho.itens).length;
  contador.textContent = quantidadeItens;
  if (quantidadeItens > 0) {
    contador.classList.add("mostrar");
  } else {
    contador.classList.remove("mostrar");
  }
}

// MODIFICADO: Função para atualizar o carrinho e o total
function atualizarCarrinho() {
  console.log("Atualizando carrinho:", carrinho);

  const itensCarrinhoDiv = document.getElementById("itens-carrinho"); // Renomeado para evitar conflito
  const valorTotalSpan = document.getElementById("valorTotal");

  if (!itensCarrinhoDiv || !valorTotalSpan) {
    console.error("Elementos do carrinho não encontrados");
    return;
  }

  itensCarrinhoDiv.innerHTML = "";
  let subTotalItens = 0;
  let temItens = false;

  for (const itemKey in carrinho.itens) {
    const item = carrinho.itens[itemKey];
    temItens = true;

    const valorItem = item.valor;
    const valorAdicionais = item.adicionaisTotal || 0;
    const subtotalItemCarrinho = valorItem + valorAdicionais;

    subTotalItens += subtotalItemCarrinho;

    const divItem = document.createElement("div");
    divItem.className = "cart-item";
    divItem.dataset.uniqueId = item.uniqueId;

    let itemNome = `${item.nome}`;
    let adicionaisHtml = "";
    let observacoesHtml = "";

    if (item.adicionais && item.adicionais.length > 0) {
      adicionaisHtml = '<div class="adicionais-list">';
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
        <div class="cart-item-price">R$ ${subtotalItemCarrinho.toFixed(2)}</div>
        <button type="button" class="btn-remove-item" data-item-id="${
          item.uniqueId
        }">×</button>
      </div>
    `;
    itensCarrinhoDiv.appendChild(divItem);

    const btnRemover = divItem.querySelector(
      `.btn-remove-item[data-item-id="${item.uniqueId}"]`
    );
    if (btnRemover) {
      btnRemover.addEventListener("click", function () {
        removerItemDoCarrinho(item.uniqueId);
      });
    }

    const btnEditar = divItem.querySelector(
      `.btn-editar-item[data-item-id="${item.uniqueId}"]`
    );
    if (btnEditar) {
      btnEditar.addEventListener("click", function () {
        editarItemDoCarrinho(item.uniqueId);
      });
    }
  }

  if (!temItens) {
    itensCarrinhoDiv.innerHTML =
      '<p class="empty-cart">Seu carrinho está vazio</p>';
  }

  let totalFinalPedido = subTotalItens;
  if (carrinho.tipoServico === "entrega" && carrinho.taxaEntrega > 0) {
    totalFinalPedido += carrinho.taxaEntrega;
  }

  carrinho.total = totalFinalPedido;
  valorTotalSpan.textContent = `R$ ${totalFinalPedido.toFixed(2)}`;

  atualizarContadorCarrinho();

  // NOVO: Salvar no localStorage o tipo de serviço e bairro
  localStorage.setItem("tipoServico", carrinho.tipoServico);
  if (carrinho.tipoServico === "entrega") {
    localStorage.setItem("bairroSelecionado", carrinho.bairroSelecionado);
  } else {
    localStorage.removeItem("bairroSelecionado"); // Remove se for retirada
  }
}
// FIM MODIFICADO

function mostrarNotificacao(mensagem) {
  const notificacaoAnterior = document.querySelector(".notificacao");
  if (notificacaoAnterior) notificacaoAnterior.remove();
  const notificacaoDiv = document.createElement("div");
  notificacaoDiv.className = "notificacao";
  notificacaoDiv.textContent = mensagem;
  document.body.appendChild(notificacaoDiv);
  setTimeout(() => {
    notificacaoDiv.classList.add("mostrar");
  }, 10);
  setTimeout(() => {
    notificacaoDiv.classList.remove("mostrar");
    setTimeout(() => {
      notificacaoDiv.remove();
    }, 500);
  }, 3000);
}

function configurarAlternadorTema() {
  const botaoTema = document.getElementById("theme-toggle-btn");
  const body = document.body;
  const temaAtual = localStorage.getItem("tema");
  if (temaAtual === "dark") {
    body.classList.add("dark-mode");
    botaoTema.textContent = "☀️ Modo Claro";
  } else if (temaAtual === "light") {
    body.classList.remove("dark-mode");
    botaoTema.textContent = "🌙 Modo Escuro";
  } else {
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

function configurarBotoesModal() {
  const modalOverlay = document.querySelector(".adicionais-modal-overlay");
  if (!modalOverlay) return;
  const btnFechar = modalOverlay.querySelector(".btn-close-adicionais");
  if (btnFechar) {
    btnFechar.replaceWith(btnFechar.cloneNode(true));
    const newBtnFechar = modalOverlay.querySelector(".btn-close-adicionais");
    newBtnFechar.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      fecharModalAdicionais();
    });
  }
  const btnConfirmar = modalOverlay.querySelector(".btn-confirmar-adicionais");
  if (btnConfirmar) {
    btnConfirmar.replaceWith(btnConfirmar.cloneNode(true));
    const newBtnConfirmar = modalOverlay.querySelector(
      ".btn-confirmar-adicionais"
    );
    newBtnConfirmar.addEventListener("click", function (event) {
      event.preventDefault();
      confirmarAdicionais();
    });
  }
}

function configurarBotoesFlutuantes() {
  const btnIrCarrinho = document.getElementById("btn-ir-carrinho");
  const btnVoltarTopo = document.getElementById("btn-voltar-topo");
  const resumoPedido = document.getElementById("resumoPedido");
  if (!btnIrCarrinho || !btnVoltarTopo || !resumoPedido) return;
  btnIrCarrinho.addEventListener("click", function () {
    const carrinhoPos =
      resumoPedido.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: carrinhoPos - 20,
      behavior: "smooth",
    });
  });
  btnVoltarTopo.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", function () {
    if (window.pageYOffset > 300) {
      btnVoltarTopo.classList.add("visivel");
    } else {
      btnVoltarTopo.classList.remove("visivel");
    }
  });
  if (window.pageYOffset > 300) {
    btnVoltarTopo.classList.add("visivel");
  }
}

function configurarBotaoWhatsApp() {
  const btnWhatsApp = document.getElementById("btnFinalizarWhatsapp");
  if (btnWhatsApp) {
    btnWhatsApp.addEventListener("click", enviarPedidoWhatsApp);
  }
}

// MODIFICADO: Função para enviar o pedido via WhatsApp
function enviarPedidoWhatsApp() {
  if (Object.keys(carrinho.itens).length === 0) {
    mostrarNotificacao(
      "Adicione itens ao carrinho antes de finalizar o pedido"
    );
    return;
  }

  if (!carrinho.nomeCliente) {
    mostrarNotificacao("Por favor, informe seu nome");
    const nomeClienteInput = document.getElementById("nomeCliente");
    if (nomeClienteInput) nomeClienteInput.focus();
    return;
  }

  if (carrinho.tipoServico === "entrega") {
    if (!carrinho.enderecoCliente) {
      mostrarNotificacao(
        "Por favor, informe seu endereço completo para entrega."
      );
      const enderecoClienteInput = document.getElementById("enderecoCliente");
      if (enderecoClienteInput) enderecoClienteInput.focus();
      return;
    }
    if (!carrinho.bairroSelecionado || carrinho.bairroSelecionado === "") {
      mostrarNotificacao("Por favor, selecione o bairro para entrega.");
      const bairroSelect = document.getElementById("bairroSelect");
      if (bairroSelect) bairroSelect.focus();
      return;
    }
    if (
      carrinho.bairroSelecionado === "Outro Bairro (Consultar)" &&
      carrinho.taxaEntrega === 0
    ) {
      // Adicionado && carrinho.taxaEntrega === 0
      mostrarNotificacao(
        "Para 'Outro Bairro', a taxa será informada após o contato. Continue se desejar ou aguarde contato."
      );
    }
  }

  if (!carrinho.formaPagamento) {
    mostrarNotificacao("Por favor, selecione uma forma de pagamento");
    const formaPagamentoSelect = document.getElementById("formaPagamento");
    if (formaPagamentoSelect) formaPagamentoSelect.focus();
    return;
  }

  const numeroWhatsApp = "5543996114268";
  let mensagem = `*🍔 NOVO PEDIDO - SPACE BURGUER 🍔*\n\n`;
  mensagem += `*👤 Cliente:* ${carrinho.nomeCliente}\n`;

  if (carrinho.tipoServico === "entrega") {
    mensagem += `*🛵 Tipo de Serviço:* Entrega\n`;
    mensagem += `*🏠 Endereço:* ${carrinho.enderecoCliente}\n`;
    mensagem += `*🏘️ Bairro:* ${carrinho.bairroSelecionado}\n`;
    if (carrinho.bairroSelecionado === "Outro Bairro (Consultar)") {
      mensagem += `*💰 Taxa de Entrega:* (A CONSULTAR)\n`;
    } else {
      mensagem += `*💰 Taxa de Entrega:* R$ ${carrinho.taxaEntrega.toFixed(
        2
      )}\n`;
    }
  } else {
    mensagem += `*🛍️ Tipo de Serviço:* Retirada na Loja\n`;
  }

  mensagem += `*💳 Forma de Pagamento:* ${carrinho.formaPagamento}\n\n`;
  mensagem += `*📝 ITENS DO PEDIDO:*\n`;

  let contadorItensMsg = 1; // Renomeado para evitar conflito
  for (const itemId in carrinho.itens) {
    const item = carrinho.itens[itemId];
    // const valorItem = item.valor; // Não precisa mais aqui
    // const valorAdicionais = item.adicionaisTotal || 0; // Não precisa mais aqui

    mensagem += `\n*${contadorItensMsg}. ${item.nome}*\n`;

    if (item.observacoes) {
      mensagem += `   ✏️ _Obs: ${item.observacoes}_\n`;
    }

    if (item.adicionais && item.adicionais.length > 0) {
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

      mensagem += `   ➕ *Adicionais:*\n`;
      for (const [id, info] of Object.entries(adicionaisContagem)) {
        mensagem += `     - ${info.quantidade}x ${info.nome} (+ R$ ${(
          info.preco * info.quantidade
        ).toFixed(2)})\n`;
      }
    }
    contadorItensMsg++;
  }

  mensagem += `\n----------------------------------\n`;
  mensagem += `*TOTAL DO PEDIDO: R$ ${carrinho.total.toFixed(2)}*\n`;
  if (
    carrinho.tipoServico === "entrega" &&
    carrinho.taxaEntrega > 0 &&
    carrinho.bairroSelecionado !== "Outro Bairro (Consultar)"
  ) {
    mensagem += `_(Itens + Taxa de Entrega)_`;
  } else if (
    carrinho.tipoServico === "entrega" &&
    carrinho.bairroSelecionado === "Outro Bairro (Consultar)"
  ) {
    mensagem += `_(Itens + Taxa de Entrega A CONSULTAR)_`;
  }
  mensagem += `\n----------------------------------\n\n`;

  mensagem += `Obrigado pelo seu pedido! Entraremos em contato em breve para confirmar.`;

  const mensagemCodificada = encodeURIComponent(mensagem);
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;

  window.open(urlWhatsApp, "_blank");
  mostrarNotificacao("Redirecionando para o WhatsApp...");
}
// FIM MODIFICADO

function configurarCamposObservacao() {
  const itemsParaObservacao = document.querySelectorAll(
    '.item[data-tipo="hamburguer"], .item[data-tipo="combo"]'
  );
  itemsParaObservacao.forEach((item) => {
    let observacaoDiv = item.querySelector(".item-observacao");
    if (!observacaoDiv) {
      observacaoDiv = document.createElement("div");
      observacaoDiv.className = "item-observacao";
      observacaoDiv.style.display = "none";
      observacaoDiv.innerHTML = `
        <textarea placeholder="Ex: retirar tomate, sem cebola, etc." class="observacao-texto"></textarea>
        <div class="observacao-botoes">
          <button type="button" class="btn-confirmar-obs">Confirmar</button>
          <button type="button" class="btn-cancelar-obs">Cancelar</button>
        </div>`;
      const itemActions = item.querySelector(".item-actions");
      if (itemActions) {
        itemActions.insertAdjacentElement("afterend", observacaoDiv);
      }
    }
    let adicionalSelector = item.querySelector(".adicional-selector");
    if (!adicionalSelector) {
      adicionalSelector = document.createElement("div");
      adicionalSelector.className = "adicional-selector";
      adicionalSelector.style.display = "none";
      adicionalSelector.innerHTML = `
        <select>
          <option value="">Selecione um adicional (opcional)</option>
        </select>`;
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
  adicionarBotoesObservacao(); // Chamada movida para o final de DOMContentLoaded para garantir que os elementos existam
}

function itemIndisponivel(event) {
  event.preventDefault();
  const div = event.target.closest(".item"); // Melhorado para pegar o item correto
  if (!div) return; // Adiciona uma verificação caso o clique não seja em um item

  if (!div.classList.contains("indisponivel")) {
    div.classList.add("indisponivel");
  } else {
    div.classList.remove("indisponivel");
  }
}

function itemEmBreve(event) {
  event.preventDefault();
  const div = event.target.closest(".item"); // Melhorado para pegar o item correto
  if (!div) return; // Adiciona uma verificação caso o clique não seja em um item

  if (!div.classList.contains("embreve")) {
    div.classList.add("embreve");
  } else {
    div.classList.remove("embreve");
  }
}
