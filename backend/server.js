const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const express = require("express");
const app = express();
app.use(express.json());

//!CRIAR ITEM
app.post("/adicionar/hamburguers", async (request, response) => {
  const { nome, descricao, preco } = request.body;
  try{ 
    const burguer = await prisma.item.create({
    data: {
      nome,
      descricao,
      preco,
    },
  });

  
  return response.status(200).send(burguer);
}catch(error){
    return response.status(400).send({menssage:"Erro ao adicionar item!"});
}
 
});

//!DELETAR ITEM
app.delete("/deletar/hamburguer/:id", async (request, response) => {
  const id = request.params.id;
  try{ 
    const burguerDeletado = await prisma.item.delete({
    where: { id },
   
  });

  return response.status(200).send("deletado com sucesso!", burguerDeletado);
}catch(error){
    return response.status(400).send({messagem:"Erro ao deletar item!"});
}
 
});
//!BUSCAR TODOS OS HAMBURGUERS
app.get("/buscar/hamburguers", async (request, response) => {
  const hamburguers = await prisma.item.findMany();

 
  return response.status(200).send(hamburguers);
});
//!BUSCAR HAMBURGUER POR ID
app.get("/buscar/hamburguer/:id", async(request,response)=>{
    const id = request.params.id;
    const hamburguerId = await prisma.item.findUnique({
        where:{id},

    })
    return response.status(200).send(hamburguerId);
})

//!EDITAR ITEM
app.put("/editar/hamburguer/:id", async (request, response)=>{
    const id = request.params.id;
    const { nome, descricao, preco } = request.body;
    const hamburguerAtualizado = await prisma.item.update({
        where:{id},
        data:{
      nome,
       descricao,
        preco 
        }
      
    })
      return response.status(200).send(hamburguerAtualizado);
})

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
