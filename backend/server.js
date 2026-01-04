import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ...

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    // Busca no model Admin (ou Usuario, se preferir)
    const admin = await prisma.admin.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!admin) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const ok = await bcrypt.compare(senha, admin.senha);
    if (!ok) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      { sub: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no login." });
  }
});
