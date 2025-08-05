const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const path = require('path'); // Passo 1

const express = require("express");
const app = express();
app.use(express.json());


const cors = require("cors");
app.use(cors());
const pastaDasImagens = path.join(__dirname, '../../img');
app.use('/img', express.static(pastaDasImagens));
//!CRIAR ITEM
app.post("/adicionar/hamburguers", async (request, response) => {
  const { nome, descricao, preco, categoria,indisponivel, novoItem,imagem_url } = request.body;
  try {
    const burguer = await prisma.item.create({
      data: {
        nome,
        descricao,
        preco,
        categoria,
        indisponivel,
        novoItem,
        imagem_url
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

//!EDITAR ITEM
app.put("/editar/hamburguer/:id", async (request, response) => {
  try {
    const id = request.params.id;
    const { nome, descricao, preco, destaque,categoria,indisponivel, novoItem, imagem_url } = request.body;
    const hamburguerAtualizado = await prisma.item.update({
      where: { id },
      data: {
        nome,
        descricao,
        preco,
        destaque,
        categoria,
        indisponivel,
        novoItem,
        imagem_url
    
      },
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

