require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Rota de login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

// Rota de cadastro
app.post("/register", async (req, res) => {
  const { email, password, name, phone } = req.body;

  try {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw authError;
    }

    const userId = authData.user?.id; // Verifica se o ID existe

    if (!userId) {
      return res.status(400).json({ error: "Erro ao obter ID do usuário." });
    }

    // Verificar se o usuário já existe na tabela 'users'
    const { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single(); // Garante que um único resultado será retornado

    if (userCheckError) {
      throw userCheckError;
    }

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Usuário já existe na tabela 'users'." });
    }

    // Inserir usuário na tabela 'users'
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: userId, // ID do usuário autenticado
        name,
        phone,
        email,
        created_at: new Date(),
      },
    ]);

    if (dbError) {
      throw dbError;
    }

    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
