import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// =======================
// __dirname (ES MODULE)
// =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =======================
// MERCADO PAGO CONFIG
// =======================
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preferenceClient = new Preference(mpClient);
const paymentClient = new Payment(mpClient);

// =======================
// EXPRESS CONFIG
// =======================
const app = express();
const port = process.env.PORT;

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // webhook MP

// =======================
// POSTGRES CONFIG
// =======================
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432)
});

// Testar conexao
pool.connect()
  .then(() => console.log("OK. PostgreSQL conectado"))
  .catch(err => console.error("Erro PostgreSQL:", err));

// =======================
// CRIAR INGRESSO
// =======================
app.post("/submit", async (req, res) => {
  const {
    dia,
    hora,
    quantidadeinteira,
    quantidademeia,
    preco,
    assento
  } = req.body;

  try {
    const quantidadeInteiraNum = Number(quantidadeinteira || 0);
    const quantidadeMeiaNum = Number(quantidademeia || 0);
    const precoNum = Number(preco || 0);

    if (
      Number.isNaN(quantidadeInteiraNum) ||
      Number.isNaN(quantidadeMeiaNum) ||
      Number.isNaN(precoNum)
    ) {
      return res.status(400).json({ error: "Valores numericos invalidos" });
    }

    const result = await pool.query(
      `
      INSERT INTO ingressos
      (dia, hora, quantidade_inteira, quantidade_meia, preco, assento, pago)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING *;
      `,
      [dia, hora, quantidadeInteiraNum, quantidadeMeiaNum, precoNum, assento]
    );

    res.json({
      message: "Ingresso criado",
      ingresso: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar ingresso" });
  }
});

// =======================
// CRIAR PAGAMENTO
// =======================
app.post("/criar-preference", async (req, res) => {
  try {
    const { ingresso_id, titulo, preco } = req.body;

    const preference = {
      items: [
        {
          id: String(ingresso_id),
          title: titulo,
          quantity: 1,
          unit_price: Number(preco)
        }
      ],
      back_urls: {
        success: "https://eve-winish-mel.ngrok-free.dev/status/sucesso.html",
        failure: "https://eve-winish-mel.ngrok-free.dev/status/erro.html",
        pending: "https://eve-winish-mel.ngrok-free.dev/status/pendente.html"
      },
      notification_url: "https://eve-winish-mel.ngrok-free.dev/webhook",
      external_reference: String(ingresso_id),
      auto_return: "approved"
    };

    const response = await preferenceClient.create({ body: preference });

    res.json({ init_point: response.init_point });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// =======================
// WEBHOOK MERCADO PAGO
// =======================
app.post("/webhook", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id;
    if (!paymentId) return res.sendStatus(200);

    const pagamento = await paymentClient.get({ id: paymentId });

    if (pagamento.status === "approved") {
      await pool.query(
        `
        UPDATE ingressos
        SET pago = true,
            data_pagamento = NOW()
        WHERE id = $1 AND pago = false
        `,
        [pagamento.external_reference]
      );

      console.log("OK. Pagamento aprovado | Ingresso:", pagamento.external_reference);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// =======================
// STATUS INGRESSO
// =======================
app.get("/ingresso/status", async (req, res) => {
  const { id } = req.query;

  const result = await pool.query(
    "SELECT pago FROM ingressos WHERE id = $1",
    [id]
  );

  res.json({ pago: result.rows[0]?.pago });
});

// =======================
// PDF INGRESSO
// =======================
app.get("/ingresso/pdf", async (req, res) => {
  const { id } = req.query;

  const result = await pool.query(
    "SELECT codigo, assento FROM ingressos WHERE id = $1 AND pago = true",
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(403).send("Ingresso nao liberado");
  }

  const ingresso = result.rows[0];
  const doc = new PDFDocument({ size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=ingresso.pdf");

  doc.pipe(res);

  doc.fontSize(20).text("Ingresso Cinema", { align: "center" });
  doc.moveDown();
  doc.text(`Assento: ${ingresso.assento}`);
  doc.text(`Codigo: ${ingresso.codigo}`);

  const qrBase64 = await QRCode.toDataURL(ingresso.codigo);
  const qrImage = Buffer.from(
    qrBase64.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );

  doc.image(qrImage, { fit: [150, 150], align: "center" });
  doc.end();
});

// =======================
// START SERVER
// =======================
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
