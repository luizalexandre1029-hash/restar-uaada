import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";  // Para X-Idempotency-Key

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Token de produção Mercado Pago
const MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-2703539769101891-101913-92def06cfd2c7a6fea465c1eeae4150c-702338274";
const MERCADO_PAGO_API = "https://api.mercadopago.com/v1/payments";

// Endpoint para gerar pagamento Pix
app.post("/generate-pix", async (req, res) => {
    try {
        const { nome, email, cpf } = req.body;

        if (!nome || !email || !cpf) {
            return res.status(400).json({ error: "Dados incompletos do pagador" });
        }

        // Separar nome e sobrenome
        const nomeSplit = nome.trim().split(" ");
        const first_name = nomeSplit[0];
        const last_name = nomeSplit.slice(1).join(" ") || "-";

        const paymentData = {
            transaction_amount: 0.02,
            description: "Inscrição RESTART",
            payment_method_id: "pix",
            payer: {
                email,
                first_name,
                last_name,
                identification: {
                    type: "CPF",
                    number: cpf
                }
            }
        };

        const response = await fetch(MERCADO_PAGO_API, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": uuidv4()  // Header obrigatório
            },
            body: JSON.stringify(paymentData)
        });

        const data = await response.json();
        console.log("Resposta Mercado Pago completa:", JSON.stringify(data, null, 2));

        if (data.point_of_interaction?.transaction_data) {
            res.json({
                id: data.id,
                qr_code: data.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64
            });
        } else {
            res.status(400).json({ error: "QR Code não encontrado", details: data });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao gerar Pix" });
    }
});

// Endpoint para verificar status do pagamento
app.get("/check-status/:payment_id", async (req, res) => {
    const payment_id = req.params.payment_id;

    try {
        const response = await fetch(`${MERCADO_PAGO_API}/${payment_id}`, {
            headers: { "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
        });

        const data = await response.json();
        res.json({ status: data.status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao verificar status" });
    }
});

// Endpoint para enviar dados para o Google Sheets
app.post("/send-to-sheet", async (req, res) => {
    try {
        const response = await fetch(
            "https://script.google.com/macros/s/AKfycbz42sRL4NjdvNSgg5itxp0wSn5GoLg6q203EfKevIqRoG-NLNI9BcbzA4NU0WW7Bt26/exec",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req.body)
            }
        );

        const data = await response.text();
        res.send(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao enviar para planilha" });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));