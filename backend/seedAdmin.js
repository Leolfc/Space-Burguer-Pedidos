import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@space.com";
  const senha = "senhaforte123";

  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.admin.upsert({
    where: { email },
    update: { senha: senhaHash },
    create: { email, senha: senhaHash },
  });

  console.log("Admin criado/atualizado com sucesso:", email);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
