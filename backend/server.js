// 1. IMPORTAÇÕES (Novo padrão ES Modules)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // Necessário para recriar __dirname
import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

// 2. RECRIANDO __dirname E __filename
// No "type": "module", estas variáveis não existem, por isso criamos:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. CONFIGURAÇÃO DO DOTENV (Para ler o banco de dados)
// Tenta achar o arquivo .env na pasta atual ou na pasta prisma
const envPathBackend = path.join(__dirname, ".env");
const envPathPrisma = path.join(__dirname, "prisma", ".env");

if (fs.existsSync(envPathBackend)) {
  dotenv.config({ path: envPathBackend });
} else if (fs.existsSync(envPathPrisma)) {
  dotenv.config({ path: envPathPrisma });
} else {
  dotenv.config(); // Tenta na raiz do projeto
}

// 4. INICIALIZAÇÃO
const app = express();
const prisma = new PrismaClient(); // Agora ele já leu o .env acima

app.use(express.json());
app.use(cors());

// 5. CONFIGURAÇÃO DO MULTER
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// 6. ARQUIVOS ESTÁTICOS
// Ajuste o caminho se necessário. Aqui sobe 2 níveis para achar a pasta img.
const pastaDasImagens = path.join(__dirname, "../../img");
app.use("/img", express.static(pastaDasImagens));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- ROTAS ---

//! CRIAR ITEM
app.post(
  "/adicionar/hamburguers",
  upload.single("imagem"),
  async (request, response) => {
    try {
      const { nome, descricao, preco, indisponivel, novoItem } = request.body;

      let { categoria } = request.body;
      let categoriasArray = [];

      try {
        if (typeof categoria === "string") {
          const parsed = JSON.parse(categoria);
          if (Array.isArray(parsed)) categoriasArray = parsed;
        }
      } catch (_) {}

      // Fallback: se não foi parsed como array, mas veio array direto ou string simples
      if (!Array.isArray(categoriasArray) && Array.isArray(categoria)) {
        categoriasArray = categoria;
      }

      const imagemUrl = request.file
        ? `/uploads/${request.file.filename}`
        : request.body.imagem_url || null;

      const burguer = await prisma.item.create({
        data: {
          nome,
          descricao,
          preco: parseFloat(preco),
          categoria: categoriasArray,
          indisponivel:
            String(indisponivel) === "true" || indisponivel === "on",
          novoItem: String(novoItem) === "true" || novoItem === "on",
          imagem_url: imagemUrl,
        },
      });

      return response.status(200).send(burguer);
    } catch (error) {
      console.log(error);
      return response.status(400).send({ message: "Erro ao adicionar item!" });
    }
  }
);

//! DELETAR ITEM
app.delete("/deletar/hamburguer/:id", async (request, response) => {
  const id = request.params.id;
  try {
    const burguerDeletado = await prisma.item.delete({
      where: { id },
    });
    return response.status(200).send(burguerDeletado);
  } catch (error) {
    console.log(error);
    return response.status(400).send({ message: "Erro ao deletar item!" });
  }
});

//! BUSCAR TODOS
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

//! BUSCAR POR ID
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

//! EDITAR ITEM
app.put(
  "/editar/hamburguer/:id",
  upload.single("imagem"),
  async (request, response) => {
    try {
      const id = request.params.id;
      let {
        nome,
        descricao,
        preco,
        destaque,
        categoria,
        indisponivel,
        novoItem,
        imagem_url,
      } = request.body;

      let categoriasArray;
      try {
        if (typeof categoria === "string") {
          const parsed = JSON.parse(categoria);
          if (Array.isArray(parsed)) categoriasArray = parsed;
        } else if (Array.isArray(categoria)) {
          categoriasArray = categoria;
        }
      } catch (_) {}

      if (request.file) {
        imagem_url = `/uploads/${request.file.filename}`;
      }

      const dataAtualizacao = {};
      if (typeof nome !== "undefined") dataAtualizacao.nome = nome;
      if (typeof descricao !== "undefined")
        dataAtualizacao.descricao = descricao;
      if (typeof preco !== "undefined")
        dataAtualizacao.preco = parseFloat(preco);
      if (typeof destaque !== "undefined")
        dataAtualizacao.destaque =
          String(destaque) === "true" || destaque === "on";
      if (typeof indisponivel !== "undefined")
        dataAtualizacao.indisponivel =
          String(indisponivel) === "true" || indisponivel === "on";
      if (typeof novoItem !== "undefined")
        dataAtualizacao.novoItem =
          String(novoItem) === "true" || novoItem === "on";
      if (typeof imagem_url !== "undefined")
        dataAtualizacao.imagem_url = imagem_url;
      if (typeof categoriasArray !== "undefined")
        dataAtualizacao.categoria = categoriasArray;

      const hamburguerAtualizado = await prisma.item.update({
        where: { id },
        data: dataAtualizacao,
      });
      return response.status(200).send(hamburguerAtualizado);
    } catch (error) {
      console.log(error);
      response.status(400).send({ message: "Erro ao editar hamburguer!" });
    }
  }
);

// --- ADICIONAIS ---
app.get("/adicionais", async (req, res) => {
  try {
    const adicionais = await prisma.adicional.findMany({
      orderBy: { nome: "asc" },
    });
    res.status(200).json(adicionais);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao buscar adicionais." });
  }
});

app.post("/adicionais", async (req, res) => {
  try {
    const { nome, preco, ativo } = req.body;
    if (!nome || typeof nome !== "string") {
      return res.status(400).json({ message: "Nome é obrigatório." });
    }
    if (typeof preco === "undefined" || Number.isNaN(Number(preco))) {
      return res.status(400).json({ message: "Preço inválido." });
    }

    const adicional = await prisma.adicional.create({
      data: {
        nome: nome.trim(),
        preco: Number(preco),
        ativo: typeof ativo === "boolean" ? ativo : true,
      },
    });
    res.status(201).json(adicional);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Erro ao adicionar adicional." });
  }
});

app.put("/adicionais/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, preco, ativo } = req.body;

    const data = {};
    if (typeof nome !== "undefined") data.nome = String(nome).trim();
    if (typeof preco !== "undefined") data.preco = Number(preco);
    if (typeof ativo !== "undefined") data.ativo = !!ativo;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Nenhuma alteração enviada." });
    }

    const adicionalAtualizado = await prisma.adicional.update({
      where: { id },
      data,
    });
    res.status(200).json(adicionalAtualizado);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Erro ao atualizar adicional." });
  }
});

app.delete("/adicionais/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adicionalDeletado = await prisma.adicional.delete({
      where: { id },
    });
    res.status(200).json(adicionalDeletado);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Erro ao deletar adicional." });
  }
});

// STATUS LOJA
app.get("/status-loja", async (req, res) => {
  try {
    let config = await prisma.configuracao.findFirst();
    if (!config) {
      config = await prisma.configuracao.create({
        data: { lojaAberta: false },
      });
    }
    res.json({ lojaAberta: config.lojaAberta });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar status da loja" });
  }
});

app.post("/alterar-status-loja", async (req, res) => {
  const { lojaAberta } = req.body;
  try {
    const config = await prisma.configuracao.findFirst();
    if (!config) {
      await prisma.configuracao.create({ data: { lojaAberta: !!lojaAberta } });
      return res.json({ lojaAberta: !!lojaAberta });
    }
    const configAtualizada = await prisma.configuracao.update({
      where: { id: config.id },
      data: { lojaAberta: lojaAberta },
    });
    res.json(configAtualizada);
  } catch (error) {
    res.status(500).json({ error: "Erro ao alterar status da loja" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
      return res
        .status(400)
        .json({ message: "Email e senha são obrigatórios." });
    }

    // Busca o admin no banco de dados
    const admin = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin) {
      // Retorna mensagem genérica para não revelar se o email existe
      return res.status(401).json({ message: "Email ou senha incorretos." });
    }

    // Compara a senha fornecida com o hash armazenado
    const senhaValida = await bcrypt.compare(senha, admin.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: "Email ou senha incorretos." });
    }

    // Login bem-sucedido
    res.status(200).json({ message: "Login bem-sucedido!" });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
