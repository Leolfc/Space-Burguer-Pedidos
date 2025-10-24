// server.js (topo do arquivo)
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// --- CONFIGURAÇÃO DO MULTER ---
const storage = multer.diskStorage({
    // Define a pasta de destino para os arquivos
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    // Define o nome do arquivo para ser único e evitar conflitos
    filename: function (req, file, cb) {
        // Ex: 166273489234-spacebacon.png
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const express = require("express");
const app = express();
app.use(express.json());


const cors = require("cors");
app.use(cors());
const pastaDasImagens = path.join(__dirname, '../../img');
app.use('/img', express.static(pastaDasImagens));
// Servir arquivos enviados via upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//!CRIAR ITEM (
app.post("/adicionar/hamburguers", upload.single('imagem'), async (request, response) => {
  try {
    const {
      nome,
      descricao,
      preco,
      indisponivel,
      novoItem
    } = request.body;

    // categoria pode vir como string ou array (quando múltiplas selecionadas)
    let { categoria } = request.body;
    let categoriasArray;
    try {
      // Quando vem via FormData pode vir como string JSON
      if (typeof categoria === 'string') {
        const parsed = JSON.parse(categoria);
        if (Array.isArray(parsed)) categoriasArray = parsed;
      }
    } catch (_) {}
    if (!Array.isArray(categoriasArray)) categoriasArray = [];

    const imagemUrl = request.file
      ? `/uploads/${request.file.filename}`
      : (request.body.imagem_url || null);

    const burguer = await prisma.item.create({
      data: {
        nome,
        descricao,
        preco: parseFloat(preco),
        categoria: categoriasArray,
        indisponivel: String(indisponivel) === 'true' || indisponivel === 'on',
        novoItem: String(novoItem) === 'true' || novoItem === 'on',
        imagem_url: imagemUrl,
      },
    });

    return response.status(200).send(burguer);
  } catch (error) {
    console.log(error);
    return response.status(400).send({ menssage: "Erro ao adicionar item!" });
  }
});

//!DELETAR ITEM
app.delete("/deletar/hamburguer/:id", async (request, response) => {
  const id = request.params.id;
  try {
    const burguerDeletado = await prisma.item.delete({
      where: { id },
    });

    return response.status(200).send(burguerDeletado);
  } catch (error) {
    console.log(error);
    return response.status(400).send({ messagem: "Erro ao deletar item!" });
  }
});
//!BUSCAR TODOS OS HAMBURGUERS
app.get("/buscar/hamburguers", async (request, response) => {
  try {
    const hamburguers = await prisma.item.findMany();

    return response.status(200).send(hamburguers);
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .send({ message: "Erro ao buscar hamburgueres!!" });
  }
});
//!BUSCAR HAMBURGUER POR ID
app.get("/buscar/hamburguer/:id", async (request, response) => {
  try {
    const id = request.params.id;
    const hamburguerId = await prisma.item.findUnique({
      where: { id },
    });
    if (!hamburguerId) {
      return response
        .status(400)
        .send({ message: "Hambúrguer não encontrado!" });
    }
    return response.status(200).send(hamburguerId);
  } catch (error) {
    console.log(error);
    return response.status(500).send({ message: "Erro ao buscar hambúrguer!" });
  }
});

//!EDITAR ITEM (com upload de imagem opcional)
app.put("/editar/hamburguer/:id", upload.single('imagem'), async (request, response) => {
  try {
    const id = request.params.id;
    let { nome, descricao, preco, destaque, categoria, indisponivel, novoItem, imagem_url } = request.body;

    // categoria pode vir como string ou array
    let categoriasArray;
    try {
      if (typeof categoria === 'string') {
        const parsed = JSON.parse(categoria);
        if (Array.isArray(parsed)) categoriasArray = parsed;
      } else if (Array.isArray(categoria)) {
        categoriasArray = categoria;
      }
    } catch (_) {}
    // undefined: não altera; array: altera

    // Se veio arquivo novo, define imagem_url; senão mantém a enviada (se houver)
    if (request.file) {
      imagem_url = `/uploads/${request.file.filename}`;
    }

    const dataAtualizacao = {};
    if (typeof nome !== 'undefined') dataAtualizacao.nome = nome;
    if (typeof descricao !== 'undefined') dataAtualizacao.descricao = descricao;
    if (typeof preco !== 'undefined') dataAtualizacao.preco = parseFloat(preco);
    if (typeof destaque !== 'undefined') dataAtualizacao.destaque = String(destaque) === 'true' || destaque === 'on';
    if (typeof indisponivel !== 'undefined') dataAtualizacao.indisponivel = String(indisponivel) === 'true' || indisponivel === 'on';
    if (typeof novoItem !== 'undefined') dataAtualizacao.novoItem = String(novoItem) === 'true' || novoItem === 'on';
    if (typeof imagem_url !== 'undefined') dataAtualizacao.imagem_url = imagem_url;
    if (typeof categoriasArray !== 'undefined') dataAtualizacao.categoria = categoriasArray;

    const hamburguerAtualizado = await prisma.item.update({
      where: { id },
      data: dataAtualizacao,
    });
    return response.status(200).send(hamburguerAtualizado);
  } catch (error) {
    console.log(error);
    response.status(400).send({ message: "Erro ao editar hamburguer!" });
  }
});



app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

// leolfc/space-burguer-pedidos/Space-Burguer-Pedidos-87c2483ea4b474ef8f24e87bf62be83b8a177c2d/backend/server.js

// ... (importações existentes no topo)

// ROTA PÚBLICA: Para o cliente saber se a loja está aberta
app.get("/status-loja", async (req, res) => {
  try {
    // Busca a primeira (e única) configuração. Se não existir, cria uma.
    let config = await prisma.configuracao.findFirst();
    if (!config) {
      config = await prisma.configuracao.create({
        data: { lojaAberta: false }, // Por padrão, a loja começa fechada
      });
    }
    res.json({ lojaAberta: config.lojaAberta });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar status da loja" });
  }
});

// ROTA PROTEGIDA: Para o admin alterar o status da loja
app.post("/alterar-status-loja", async (req, res) => {
  // ATENÇÃO: Aqui precisaremos adicionar uma verificação de login (token) no futuro.
  // Por enquanto, vamos deixar simples para você entender a lógica.
  const { lojaAberta } = req.body; // Espera receber { "lojaAberta": true } ou { "lojaAberta": false }

  try {
    const config = await prisma.configuracao.findFirst();
    const configAtualizada = await prisma.configuracao.update({
      where: { id: config.id },
      data: { lojaAberta: lojaAberta },
    });
    res.json(configAtualizada);
  } catch (error) {
    res.status(500).json({ error: "Erro ao alterar status da loja" });
  }
});


// ROTA DE LOGIN (Exemplo simples)
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    // Em um projeto real, você deve criar um usuário admin primeiro e criptografar a senha!
    // Exemplo: if (email === 'admin@space.com' && senhaCriptografadaCorresponde(senha, hashDoBanco))
    if (email === "admin@space.com" && senha === "senhaforte123") {
        // Lógica de sucesso. Em um app real, você geraria um Token JWT aqui.
        res.status(200).json({ message: "Login bem-sucedido!" });
    } else {
        res.status(401).json({ message: "Credenciais inválidas." });
    }
});


