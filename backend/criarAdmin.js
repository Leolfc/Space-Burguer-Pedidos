// Script para criar/atualizar o usuário admin inicial com senha hasheada
// Uso: npm run criar-admin -- <email> <senha>

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv
const envPathBackend = path.join(__dirname, ".env");
const envPathPrisma = path.join(__dirname, "prisma", ".env");
const envPathRoot = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPathBackend)) dotenv.config({ path: envPathBackend });
else if (fs.existsSync(envPathPrisma)) dotenv.config({ path: envPathPrisma });
else if (fs.existsSync(envPathRoot)) dotenv.config({ path: envPathRoot });
else dotenv.config();

const prisma = new PrismaClient();

function die(msg) {
  console.error(`❌ ${msg}`);
  console.error("Uso: npm run criar-admin -- <email> <senha>");
  process.exit(1);
}

async function criarAdmin() {
  const emailArg = process.argv[2];
  const senhaArg = process.argv[3];

  if (!emailArg) die("Email não informado.");
  if (!senhaArg) die("Senha não informada.");

  const email = String(emailArg).trim().toLowerCase();
  const senha = String(senhaArg);

  if (!email.includes("@")) die("Email inválido.");
  if (senha.length < 10) die("Senha fraca: use pelo menos 10 caracteres.");

  try {
    console.log(`Criando/atualizando admin com email: ${email}`);

    const adminExistente = await prisma.admin.findUnique({ where: { email } });

    const saltRounds = 12;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    if (adminExistente) {
      await prisma.admin.update({
        where: { email },
        data: { senha: senhaHash },
      });
      console.log("✅ Senha do admin atualizada com sucesso!");
    } else {
      await prisma.admin.create({
        data: { email, senha: senhaHash },
      });
      console.log("✅ Admin criado com sucesso!");
    }

    console.log("⚠️  IMPORTANTE: não compartilhe sua senha e guarde-a em local seguro.");
  } catch (error) {
    console.error("❌ Erro ao criar admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

criarAdmin();
