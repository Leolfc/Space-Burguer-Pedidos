// backend/server.js
// ES Modules (package.json: { "type": "module" })

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";
import multer from "multer";
import session from "express-session";

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

/* =========================
   1) __dirname / __filename
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   2) Dotenv (ANTES do Prisma)
========================= */
// Tenta achar o .env no backend, no prisma, ou na raiz
const envPathBackend = path.join(__dirname, ".env");
const envPathPrisma = path.join(__dirname, "prisma", ".env");
const envPathRoot = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPathBackend)) dotenv.config({ path: envPathBackend });
else if (fs.existsSync(envPathPrisma)) dotenv.config({ path: envPathPrisma });
else if (fs.existsSync(envPathRoot)) dotenv.config({ path: envPathRoot });
else dotenv.config();

/* =========================
   3) Prisma (depois do env)
========================= */
const prisma = new PrismaClient();

/* =========================
   4) App + Middlewares base
========================= */
const app = express();

// Se estiver atrás de proxy (EasyPanel/NGINX), ajuda cookies "secure"
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * CORS:
 * - Se seu front e backend estão no MESMO domínio, pode até remover cors.
 * - Se quiser travar, use ORIGIN no env:
 *   FRONTEND_ORIGIN=https://seu-dominio.com
 */
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || ""; // ex: https://space-burguer-space.ochndi.easypanel.host
app.use(
  cors({
    origin: (origin, cb) => {
      // requisições sem origin (curl/postman) devem passar
      if (!origin) return cb(null, true);

      // Se FRONTEND_ORIGIN não foi definido, libera (mesmo-origem geralmente nem precisa)
      if (!FRONTEND_ORIGIN) return cb(null, true);

      // Libera apenas o domínio configurado
      if (origin === FRONTEND_ORIGIN) return cb(null, true);

      return cb(new Error("CORS bloqueado para esta origem."));
    },
    credentials: true,
  })
);

/* =========================
   5) Sessão (login REAL)
========================= */
const SESSION_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.warn(
    "[WARN] JWT_SECRET/SESSION_SECRET não definido. Defina no EasyPanel para sessão funcionar com segurança."
  );
}

app.use(
  session({
    name: "spaceburguer.sid",
    secret: SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // IMPORTANTE: EasyPanel/Hostinger usa proxy NGINX com HTTPS.
      // Mesmo em desenvolvimento, os cookies precisam de secure: true para HTTPS.
      // Se estiver testando em localhost:3000 (HTTP), mude para false.
      secure: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    },
  })
);

function requireAdmin(req, res, next) {
  if (req.session?.adminLoggedIn) return next();
  // Se for API, devolve 401; se for página, redireciona
  const acceptsHtml = req.headers.accept?.includes("text/html");
  if (acceptsHtml) return res.redirect("/login");
  return res.status(401).json({ message: "Não autorizado" });
}

/* =========================
   6) Arquivos estáticos
========================= */

// 6.1 Imagens públicas do site (pasta /img está na raiz do projeto)
const pastaDasImagens = path.join(__dirname, "../img"); // ✅ corrigido
if (fs.existsSync(pastaDasImagens)) {
  app.use("/img", express.static(pastaDasImagens));
}

// 6.2 Uploads (backend/uploads)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// 6.3 Site público (index.html, css/js na raiz)
app.use(express.static(path.join(__dirname, "../")));

// 6.4 Painel: sirva APENAS a pasta pública do painel (se existir).
// Recomendado: mover login.html, admin.html, admin.js, styleAdm.css para backend/public/
// Mas para não quebrar seu projeto atual, fazemos fallback para backend/.
const painelPublicDir = fs.existsSync(path.join(__dirname, "public"))
  ? path.join(__dirname, "public")
  : __dirname;

// assets do painel: /painel/styleAdm.css, /painel/admin.js, etc
app.use("/painel", express.static(painelPublicDir));

/* =========================
   7) Rotas de páginas
========================= */
app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "../index.html"));
});

// Login page
app.get("/login", (req, res) => {
  // Se já logado, vai direto
  if (req.session?.adminLoggedIn) return res.redirect("/admin");
  return res.sendFile(path.join(painelPublicDir, "login.html"));
});

// Admin page (protegida)
app.get("/admin", requireAdmin, (req, res) => {
  return res.sendFile(path.join(painelPublicDir, "admin.html"));
});

/* =========================
   8) Multer (upload de imagens)
========================= */
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* =========================
   9) Auth API (login/logout)
========================= */

// Login via JSON (para seu fetch no login.html)
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!admin) {
      return res.status(401).json({ message: "Email ou senha incorretos." });
    }

    const senhaValida = await bcrypt.compare(String(senha), admin.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: "Email ou senha incorretos." });
    }

    req.session.adminLoggedIn = true;
    req.session.adminEmail = admin.email;

    return res.status(200).json({ ok: true, message: "Login bem-sucedido!" });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("spaceburguer.sid");
    return res.status(200).json({ ok: true });
  });
});

// Verificar autenticação (para admin.js)
app.get("/check-auth", (req, res) => {
  if (req.session?.adminLoggedIn) {
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ message: "Não autorizado" });
});

/* =========================
   10) API do sistema
========================= */

// CRIAR ITEM
app.post("/adicionar/hamburguers", requireAdmin, upload.single("imagem"), async (req, res) => {
  try {
    const { nome, descricao, preco, indisponivel, novoItem } = req.body;

    let { categoria } = req.body;
    let categoriasArray = [];

    try {
      if (typeof categoria === "string") {
        const parsed = JSON.parse(categoria);
        if (Array.isArray(parsed)) categoriasArray = parsed;
      }
    } catch (_) {}

    if (!Array.isArray(categoriasArray) && Array.isArray(categoria)) {
      categoriasArray = categoria;
    }

    const imagemUrl = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.imagem_url || null;

    const burguer = await prisma.item.create({
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

    return res.status(200).json(burguer);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao adicionar item!" });
  }
});

// DELETAR ITEM
app.delete("/deletar/hamburguer/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const burguerDeletado = await prisma.item.delete({ where: { id } });
    return res.status(200).json(burguerDeletado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao deletar item!" });
  }
});

// BUSCAR TODOS
app.get("/buscar/hamburguers", async (_req, res) => {
  try {
    const hamburguers = await prisma.item.findMany();
    return res.status(200).json(hamburguers);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao buscar hamburgueres!!" });
  }
});

// BUSCAR POR ID
app.get("/buscar/hamburguer/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const hamburguerId = await prisma.item.findUnique({ where: { id } });

    if (!hamburguerId) {
      return res.status(404).json({ message: "Hambúrguer não encontrado!" });
    }

    return res.status(200).json(hamburguerId);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao buscar hambúrguer!" });
  }
});

// EDITAR ITEM
app.put("/editar/hamburguer/:id", requireAdmin, upload.single("imagem"), async (req, res) => {
  try {
    const id = req.params.id;
    let {
      nome,
      descricao,
      preco,
      destaque,
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

    const dataAtualizacao = {};
    if (typeof nome !== "undefined") dataAtualizacao.nome = nome;
    if (typeof descricao !== "undefined") dataAtualizacao.descricao = descricao;
    if (typeof preco !== "undefined") dataAtualizacao.preco = parseFloat(preco);
    if (typeof destaque !== "undefined")
      dataAtualizacao.destaque = String(destaque) === "true" || destaque === "on";
    if (typeof indisponivel !== "undefined")
      dataAtualizacao.indisponivel =
        String(indisponivel) === "true" || indisponivel === "on";
    if (typeof novoItem !== "undefined")
      dataAtualizacao.novoItem = String(novoItem) === "true" || novoItem === "on";
    if (typeof imagem_url !== "undefined") dataAtualizacao.imagem_url = imagem_url;
    if (typeof categoriasArray !== "undefined")
      dataAtualizacao.categoria = categoriasArray;

    const hamburguerAtualizado = await prisma.item.update({
      where: { id },
      data: dataAtualizacao,
    });

    return res.status(200).json(hamburguerAtualizado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao editar hamburguer!" });
  }
});

// ADICIONAIS
app.get("/adicionais", async (_req, res) => {
  try {
    const adicionais = await prisma.adicional.findMany({ orderBy: { nome: "asc" } });
    return res.status(200).json(adicionais);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao buscar adicionais." });
  }
});

app.post("/adicionais", requireAdmin, async (req, res) => {
  try {
    const { nome, preco, ativo } = req.body;
    if (!nome || typeof nome !== "string")
      return res.status(400).json({ message: "Nome é obrigatório." });

    if (typeof preco === "undefined" || Number.isNaN(Number(preco)))
      return res.status(400).json({ message: "Preço inválido." });

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

app.put("/adicionais/:id", requireAdmin, async (req, res) => {
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

    const adicionalAtualizado = await prisma.adicional.update({ where: { id }, data });
    return res.status(200).json(adicionalAtualizado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao atualizar adicional." });
  }
});

app.delete("/adicionais/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adicionalDeletado = await prisma.adicional.delete({ where: { id } });
    return res.status(200).json(adicionalDeletado);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Erro ao deletar adicional." });
  }
});

// CATEGORIAS (persistidas)
app.get("/categorias", async (_req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({ orderBy: { label: "asc" } });
    return res.status(200).json(categorias);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar categorias." });
  }
});

app.post("/categorias", requireAdmin, async (req, res) => {
  try {
    const { valor, label } = req.body;
    if (!valor || !label)
      return res.status(400).json({ message: "Valor e label são obrigatórios." });

    const existente = await prisma.categoria
      .findUnique({ where: { valor } })
      .catch(() => null);

    if (existente) return res.status(409).json({ message: "Categoria já existe." });

    const nova = await prisma.categoria.create({ data: { valor, label } });
    return res.status(201).json(nova);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Erro ao criar categoria." });
  }
});

app.delete("/categorias/:valor", requireAdmin, async (req, res) => {
  try {
    const { valor } = req.params;
    const cat = await prisma.categoria.findUnique({ where: { valor } });
    if (!cat) return res.status(404).json({ message: "Categoria não encontrada." });

    const deletada = await prisma.categoria.delete({ where: { id: cat.id } });
    return res.status(200).json(deletada);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Erro ao deletar categoria." });
  }
});

// STATUS LOJA
app.get("/status-loja", async (_req, res) => {
  try {
    let config = await prisma.configuracao.findFirst();
    if (!config) {
      config = await prisma.configuracao.create({ data: { lojaAberta: false } });
    }
    return res.json({ lojaAberta: config.lojaAberta });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar status da loja" });
  }
});

app.post("/alterar-status-loja", requireAdmin, async (req, res) => {
  const { lojaAberta } = req.body;
  try {
    const config = await prisma.configuracao.findFirst();
    if (!config) {
      await prisma.configuracao.create({ data: { lojaAberta: !!lojaAberta } });
      return res.json({ lojaAberta: !!lojaAberta });
    }
    const configAtualizada = await prisma.configuracao.update({
      where: { id: config.id },
      data: { lojaAberta: !!lojaAberta },
    });
    return res.json(configAtualizada);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao alterar status da loja" });
  }
});

/* =========================
   11) Healthcheck (útil no deploy)
========================= */
app.get("/health", (_req, res) => res.status(200).send("ok"));

/* =========================
   12) Start
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
