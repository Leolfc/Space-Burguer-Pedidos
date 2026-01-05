// backend/server.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

// ----------------------
// ENV
// ----------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// tenta ler .env do backend e do prisma
const envPathBackend = path.join(__dirname, ".env");
const envPathPrisma = path.join(__dirname, "prisma", ".env");

if (fs.existsSync(envPathBackend)) dotenv.config({ path: envPathBackend });
else if (fs.existsSync(envPathPrisma)) dotenv.config({ path: envPathPrisma });
else dotenv.config();

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET não está definido no .env");
}

const app = express();
const prisma = new PrismaClient();

// ----------------------
// MIDDLEWARES
// ----------------------
app.use(cors());
app.use(express.json());

// ----------------------
// MULTER (UPLOAD)
// ----------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ----------------------
// STATIC (IMAGENS)
// ----------------------
const pastaDasImagens = path.join(__dirname, "../../img");
app.use("/img", express.static(pastaDasImagens));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----------------------
// AUTH (JWT)
// ----------------------
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token ausente" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { adminId, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido/expirado" });
  }
}

// ----------------------
// HEALTH
// ----------------------
app.get("/health", (req, res) => res.json({ ok: true }));

// ----------------------
// LOGIN (BANCO + BCRYPT + JWT)
// ----------------------
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha são obrigatórios" });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ message: "Credenciais inválidas" });

    const ok = await bcrypt.compare(senha, admin.senha);
    if (!ok) return res.status(401).json({ message: "Credenciais inválidas" });

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no login" });
  }
});

// QUEM SOU EU (pra mostrar email no painel)
app.get("/me", auth, async (req, res) => {
  return res.json({ user: { email: req.user.email, adminId: req.user.adminId } });
});

// ----------------------
// STATUS DA LOJA
// ----------------------
app.get("/status-loja", async (req, res) => {
  try {
    let config = await prisma.configuracao.findFirst();
    if (!config) {
      config = await prisma.configuracao.create({ data: { lojaAberta: false } });
    }
    res.json({ lojaAberta: config.lojaAberta });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar status da loja" });
  }
});

// PROTEGIDA (somente admin)
app.post("/alterar-status-loja", auth, async (req, res) => {
  const { lojaAberta } = req.body;
  try {
    let config = await prisma.configuracao.findFirst();
    if (!config) {
      config = await prisma.configuracao.create({
        data: { lojaAberta: !!lojaAberta },
      });
      return res.json({ lojaAberta: config.lojaAberta });
    }

    const configAtualizada = await prisma.configuracao.update({
      where: { id: config.id },
      data: { lojaAberta: !!lojaAberta },
    });

    res.json({ lojaAberta: configAtualizada.lojaAberta });
  } catch (error) {
    res.status(500).json({ error: "Erro ao alterar status da loja" });
  }
});

// ----------------------
// ITENS DO CARDÁPIO (CRUD)
// ----------------------

// LISTAR (público)
app.get("/buscar/hamburguers", async (req, res) => {
  try {
    const hamburguers = await prisma.item.findMany();
    return res.status(200).json(hamburguers);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao buscar hamburgueres!" });
  }
});

// BUSCAR POR ID (público)
app.get("/buscar/hamburguer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ message: "Item não encontrado" });
    return res.json(item);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao buscar item" });
  }
});

// CRIAR (protegido)
app.post("/adicionar/hamburguers", auth, upload.single("imagem"), async (req, res) => {
  try {
    const { nome, descricao, preco, indisponivel, novoItem } = req.body;

    let { categoria } = req.body;
    let categoriasArray = [];

    try {
      if (typeof categoria === "string") {
        const parsed = JSON.parse(categoria);
        if (Array.isArray(parsed)) categoriasArray = parsed;
      } else if (Array.isArray(categoria)) {
        categoriasArray = categoria;
      }
    } catch (_) {}

    const imagemUrl = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.imagem_url || null;

    const criado = await prisma.item.create({
      data: {
        nome,
        descricao,
        preco: parseFloat(preco),
        categoria: categoriasArray,
        indisponivel: String(indisponivel) === "true" || indisponivel === "on",
        novoItem: String(novoItem) === "true" || novoItem === "on",
        imagem_url: imagemUrl,
      },
    });

    return res.status(201).json(criado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao adicionar item!" });
  }
});

// EDITAR (protegido)
app.put("/editar/hamburguer/:id", auth, upload.single("imagem"), async (req, res) => {
  try {
    const { id } = req.params;
    let {
      nome,
      descricao,
      preco,
      categoria,
      indisponivel,
      novoItem,
      imagem_url,
    } = req.body;

    let categoriasArray;
    try {
      if (typeof categoria === "string") {
        const parsed = JSON.parse(categoria);
        if (Array.isArray(parsed)) categoriasArray = parsed;
      } else if (Array.isArray(categoria)) {
        categoriasArray = categoria;
      }
    } catch (_) {}

    if (req.file) {
      imagem_url = `/uploads/${req.file.filename}`;
    }

    const data = {};
    if (typeof nome !== "undefined") data.nome = nome;
    if (typeof descricao !== "undefined") data.descricao = descricao;
    if (typeof preco !== "undefined") data.preco = parseFloat(preco);
    if (typeof indisponivel !== "undefined")
      data.indisponivel = String(indisponivel) === "true" || indisponivel === "on";
    if (typeof novoItem !== "undefined")
      data.novoItem = String(novoItem) === "true" || novoItem === "on";
    if (typeof imagem_url !== "undefined") data.imagem_url = imagem_url;
    if (typeof categoriasArray !== "undefined") data.categoria = categoriasArray;

    const atualizado = await prisma.item.update({
      where: { id },
      data,
    });

    return res.json(atualizado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao editar item!" });
  }
});

// DELETAR (protegido)
app.delete("/deletar/hamburguer/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const deletado = await prisma.item.delete({ where: { id } });
    return res.json(deletado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao deletar item!" });
  }
});
// ----------------------
// ADICIONAIS (GET público; CRUD protegido)
// ----------------------
app.get("/adicionais", async (req, res) => {
  try {
    const itens = await prisma.adicional.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });
    return res.json(itens);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao buscar adicionais" });
  }
});

// criar adicional (protegido)
app.post("/adicionais", auth, async (req, res) => {
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

    return res.status(201).json(adicional);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao adicionar adicional." });
  }
});

// editar adicional (protegido)
app.put("/adicionais/:id", auth, async (req, res) => {
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

    const atualizado = await prisma.adicional.update({ where: { id }, data });
    return res.json(atualizado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao atualizar adicional." });
  }
});

// deletar adicional (protegido)
app.delete("/adicionais/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletado = await prisma.adicional.delete({ where: { id } });
    return res.json(deletado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao deletar adicional." });
  }
});


// ----------------------
// START
// ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
