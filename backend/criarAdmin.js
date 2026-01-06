// Script para criar o usuário admin inicial com senha hasheada
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv
const envPathBackend = path.join(__dirname, '.env');
const envPathPrisma = path.join(__dirname, 'prisma', '.env');

if (fs.existsSync(envPathBackend)) {
    dotenv.config({ path: envPathBackend });
} else if (fs.existsSync(envPathPrisma)) {
    dotenv.config({ path: envPathPrisma });
} else {
    dotenv.config();
}

const prisma = new PrismaClient();

async function criarAdmin() {
    try {
        const email = process.argv[2] || "admin@space.com";
        const senha = process.argv[3] || "senhaforte123";

        console.log(`Criando admin com email: ${email}`);

        // Verifica se já existe um admin com esse email
        const adminExistente = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (adminExistente) {
            console.log("Admin já existe! Atualizando senha...");
            
            // Gera hash da senha
            const saltRounds = 10;
            const senhaHash = await bcrypt.hash(senha, saltRounds);
            
            // Atualiza a senha
            await prisma.admin.update({
                where: { email: email.toLowerCase() },
                data: { senha: senhaHash }
            });
            
            console.log("✅ Senha do admin atualizada com sucesso!");
        } else {
            // Gera hash da senha
            const saltRounds = 10;
            const senhaHash = await bcrypt.hash(senha, saltRounds);
            
            // Cria o admin
            await prisma.admin.create({
                data: {
                    email: email.toLowerCase(),
                    senha: senhaHash
                }
            });
            
            console.log("✅ Admin criado com sucesso!");
        }

        console.log("\n📝 Credenciais:");
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${senha}`);
        console.log("\n⚠️  IMPORTANTE: Guarde essas credenciais em local seguro!");
        
    } catch (error) {
        console.error("❌ Erro ao criar admin:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

criarAdmin();
