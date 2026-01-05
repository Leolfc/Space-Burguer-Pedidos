// backend/seedAdicionais.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adicionaisPadrao = [
  { nome: "Hambúrguer 160g", preco: 10.0, ativo: true },
  { nome: "Hambúrguer 95g", preco: 7.0, ativo: true },
  { nome: "Bacon 🥓", preco: 8.0, ativo: true },
  { nome: "Queijo Cheddar", preco: 4.0, ativo: true },
  { nome: "Queijo Mussarela 🧀", preco: 3.0, ativo: true },
  { nome: "Molho American Cheese", preco: 5.0, ativo: true },
  { nome: "Molho Barbercue", preco: 5.0, ativo: true },
  { nome: "Calabresa", preco: 8.0, ativo: true },
  { nome: "Ovo Frito 🥚", preco: 3.0, ativo: true },
  { nome: "Salsicha (2 Un.)", preco: 4.0, ativo: true },
  { nome: "Cebola Caramelizada", preco: 7.0, ativo: true },
  { nome: "Tomate 🍅", preco: 2.0, ativo: true },
  { nome: "Alface Americana 🥬", preco: 2.0, ativo: true },
  { nome: "Cebola Roxa", preco: 2.5, ativo: true },
  { nome: "Catupiry", preco: 8.0, ativo: true },
  { nome: "Doritos", preco: 5.0, ativo: true },
  { nome: "Picles 🥒", preco: 7.0, ativo: true },
];

async function main() {
  for (const ad of adicionaisPadrao) {
    await prisma.adicional.upsert({
      where: { nome: ad.nome },
      update: { preco: ad.preco, ativo: ad.ativo },
      create: { nome: ad.nome, preco: ad.preco, ativo: ad.ativo },
    });
  }

  const total = await prisma.adicional.count();
  console.log(`✅ Seed OK: adicionais no banco = ${total}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
