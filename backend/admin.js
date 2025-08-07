// Espera o HTML carregar antes de executar qualquer código
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. REFERÊNCIAS AOS ELEMENTOS ---
    // Botões de navegação
    const btnMostrarGerenciar = document.getElementById('btn-mostrar-gerenciar');
    const btnMostrarAdicionar = document.getElementById('btn-mostrar-adicionar');

    // Telas (divs)
    const telaGerenciar = document.getElementById('tela-gerenciar');
    const telaAdicionar = document.getElementById('tela-adicionar');
    
    // Formulário de adicionar
    const formAdicionar = document.getElementById('form-adicionar-lanche');

    // Corpo da tabela de lanches
    const tabelaCorpo = document.getElementById('tabela-lanches-corpo');


    // --- 2. LÓGICA DE NAVEGAÇÃO ENTRE TELAS (O CORAÇÃO DA SPA) ---
    
    // Função que esconde todas as telas e mostra apenas a desejada
    function mostrarTela(idTelaParaMostrar) {
        // Esconde todas as telas
        telaGerenciar.style.display = 'none';
        telaAdicionar.style.display = 'none';
        
        // Remove a classe 'active' de todos os botões
        btnMostrarGerenciar.classList.remove('active');
        btnMostrarAdicionar.classList.remove('active');

        // Mostra a tela correta e ativa o botão correspondente
        if (idTelaParaMostrar === 'tela-gerenciar') {
            telaGerenciar.style.display = 'block';
            btnMostrarGerenciar.classList.add('active');
        } else if (idTelaParaMostrar === 'tela-adicionar') {
            telaAdicionar.style.display = 'block';
            btnMostrarAdicionar.classList.add('active');
        }
    }

    // Eventos de clique nos botões de navegação
    btnMostrarGerenciar.addEventListener('click', () => {
        carregarLanches(); // Sempre recarrega os lanches ao ir para a tela de gerenciamento
        mostrarTela('tela-gerenciar');
    });

    btnMostrarAdicionar.addEventListener('click', () => {
        mostrarTela('tela-adicionar');
    });

    
    // --- 3. LÓGICA DA TELA "GERENCIAR" ---
    
    async function carregarLanches() {
        try {
            const response = await fetch('http://localhost:3000/buscar/hamburguers');
            if (!response.ok) throw new Error('Falha ao buscar lanches.');
            
            const lanches = await response.json();
            tabelaCorpo.innerHTML = ''; // Limpa a tabela

            lanches.forEach(lanche => {
                const linha = document.createElement('tr');
                const precoFormatado = `R$ ${parseFloat(lanche.preco).toFixed(2).replace('.', ',')}`;
                const categoriasTexto = lanche.categoria.join(', ');

                linha.innerHTML = `
                    <td>${lanche.nome}</td>
                    <td>${precoFormatado}</td>
                    <td>${categoriasTexto}</td>
                    <td class="acoes">
                        <button class="btn-editar" data-id="${lanche.id}">Editar</button>
                        <button class="btn-deletar" data-id="${lanche.id}">Deletar</button>
                    </td>
                `;
                tabelaCorpo.appendChild(linha);
            });
        } catch (error) {
            console.error('Erro ao carregar lanches:', error);
            tabelaCorpo.innerHTML = '<tr><td colspan="4">Erro ao carregar cardápio.</td></tr>';
        }
    }

    // --- 4. LÓGICA DA TELA "ADICIONAR" ---

    formAdicionar.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const checkboxes = formAdicionar.querySelectorAll('input[name="categoria"]:checked');
        const categorias = Array.from(checkboxes).map(cb => cb.value);

        if (categorias.length === 0) {
            alert('Por favor, selecione pelo menos uma categoria.');
            return;
        }

        const dadosDoLanche = {
            nome: document.getElementById('nome').value,
            descricao: document.getElementById('descricao').value,
            preco: parseFloat(document.getElementById('preco').value),
            categoria: categorias,
            imagem_url: document.getElementById('imagem_url').value,
            novoItem: document.getElementById('novoItem').checked,
            indisponivel: document.getElementById('indisponivel').checked
        };
        
        try {
            const response = await fetch('http://localhost:3000/adicionar/hamburguers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosDoLanche),
            });

            if (response.ok) {
                alert('Lanche adicionado com sucesso!');
                formAdicionar.reset();
                // Após adicionar, volta para a tela de gerenciamento para ver o novo item
                carregarLanches();
                mostrarTela('tela-gerenciar');
            } else {
                throw new Error('Erro ao adicionar lanche.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Falha ao adicionar lanche.');
        }
    });

    // --- 5. INICIALIZAÇÃO ---
    // Define a tela inicial que será mostrada ao carregar a página
    carregarLanches();
    mostrarTela('tela-gerenciar');
    


// --- DELEGAÇÃO DE EVENTOS PARA AÇÕES NA TABELA ---

// Adicionamos o "escutador" de cliques no corpo da tabela (o "pai")
tabelaCorpo.addEventListener('click', async (event) => {
    
    // Verificamos se o elemento clicado (event.target) possui a classe 'btn-deletar'
    if (event.target.classList.contains('btn-deletar')) {
        
        // 1. Pega o ID do lanche guardado no atributo 'data-id' do botão
        const idDoLanche = event.target.dataset.id;
        
        // 2. Pede confirmação ao usuário
        const confirmou = confirm('Você tem certeza que deseja deletar este lanche? Esta ação não pode ser desfeita.');

        // 3. Se o usuário clicou em "OK" (true), continua com a exclusão
        if (confirmou) {
            try {
                // 4. Envia a requisição DELETE para o backend, passando o ID na URL
                const response = await fetch(`http://localhost:3000/deletar/hamburguer/${idDoLanche}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Lanche deletado com sucesso!');
                    // 5. Recarrega a lista de lanches para atualizar a tabela na tela
                    carregarLanches(); 
                } else {
                    // Tenta ler a mensagem de erro do backend, se houver
                    const erro = await response.json();
                    throw new Error(erro.message || 'Falha ao deletar o lanche.');
                }

            } catch (error) {
                console.error('Erro ao deletar:', error);
                alert(`Ocorreu um erro ao tentar deletar o lanche: ${error.message}`);
            }
        }
    }

    // No futuro, adicionaremos a lógica para o botão de editar aqui também
    if (event.target.classList.contains('btn-editar')) {
        // Lógica de edição virá aqui na próxima aula
        const idDoLanche = event.target.dataset.id;
        console.log('Clicou em Editar para o ID:', idDoLanche);
        alert('Funcionalidade de Editar será implementada em breve!');
    }
});
});
