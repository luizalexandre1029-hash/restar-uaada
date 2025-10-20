// import fetch from "node-fetch";
// import { v4 as uuidv4 } from "uuid";

// const MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-2703539769101891-101913-92def06cfd2c7a6fea465c1eeae4150c-702338274";
// const MERCADO_PAGO_API = "https://api.mercadopago.com/v1/payments";

// export default async function handler(req, res) {
//     // Permitir CORS
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//     if (req.method === "OPTIONS") {
//         res.status(200).end();
//         return;
//     }

//     const url = req.url;

//     try {
//         // =========================
//         // ✅ Gerar PIX
//         // =========================
//         if (url.includes("/generate-pix") && req.method === "POST") {
//             const { nome, email, cpf } = req.body;

//             if (!nome || !email || !cpf) {
//                 return res.status(400).json({ error: "Dados incompletos do pagador" });
//             }

//             const nomeSplit = nome.trim().split(" ");
//             const first_name = nomeSplit[0];
//             const last_name = nomeSplit.slice(1).join(" ") || "-";

//             const paymentData = {
//                 transaction_amount: 10.0,
//                 description: "Inscrição RESTART",
//                 payment_method_id: "pix",
//                 payer: {
//                     email,
//                     first_name,
//                     last_name,
//                     identification: { type: "CPF", number: cpf }
//                 }
//             };

//             const responseMP = await fetch(MERCADO_PAGO_API, {
//                 method: "POST",
//                 headers: {
//                     "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
//                     "Content-Type": "application/json",
//                     "X-Idempotency-Key": uuidv4()
//                 },
//                 body: JSON.stringify(paymentData)
//             });

//             const data = await responseMP.json();

//             if (data.point_of_interaction?.transaction_data) {
//                 res.status(200).json({
//                     id: data.id,
//                     qr_code: data.point_of_interaction.transaction_data.qr_code,
//                     qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64
//                 });
//             } else {
//                 res.status(400).json({ error: "QR Code não encontrado", details: data });
//             }
//             return;
//         }

//         // =========================
//         // ✅ Verificar status do pagamento
//         // =========================
//         if (url.includes("/check-status") && req.method === "GET") {
//             const payment_id = url.split("/check-status/")[1];

//             const responseMP = await fetch(`${MERCADO_PAGO_API}/${payment_id}`, {
//                 headers: { "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
//             });

//             const data = await responseMP.json();
//             res.status(200).json({ status: data.status });
//             return;
//         }

//         // =========================
//         // ✅ Enviar para Google Sheets
//         // =========================
//         if (url.includes("/send-to-sheet") && req.method === "POST") {
//             const responseGS = await fetch(
//                 "https://script.google.com/macros/s/AKfycbz42sRL4NjdvNSgg5itxp0wSn5GoLg6q203EfKevIqRoG-NLNI9BcbzA4NU0WW7Bt26/exec",
//                 {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify(req.body)
//                 }
//             );
//             const data = await responseGS.text();
//             res.status(200).send(data);
//             return;
//         }

//         res.status(404).json({ error: "Rota não encontrada" });

//     } catch (err) {
//         console.error("❌ Erro no handler:", err);
//         res.status(500).json({ error: "Erro no servidor" });
//     }
// }




import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-2703539769101891-101913-92def06cfd2c7a6fea465c1eeae4150c-702338274";
const MERCADO_PAGO_API = "https://api.mercadopago.com/v1/payments";
const DATA_FILE = "./data.json";

function lerContador() {
    try {
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return { inscritos: 0, limite: 250 };
    }
}

function salvarContador(contador) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(contador, null, 2));
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    const url = req.url;
    const contador = lerContador();

    try {
        // =======================
        // 🟡 Status geral (vagas restantes)
        // =======================
        if (url.includes("/status") && req.method === "GET") {
            const vagasRestantes = Math.max(contador.limite - contador.inscritos, 0);
            return res.status(200).json({ inscritos: contador.inscritos, vagasRestantes });
        }

        // =======================
        // 🚫 Se limite atingido
        // =======================
        if (contador.inscritos >= contador.limite && url.includes("/generate-pix")) {
            return res.status(403).json({ error: "Inscrições para o primeiro lote esgotadas" });
        }

        // =======================
        // ✅ Gerar PIX
        // =======================
        if (url.includes("/generate-pix") && req.method === "POST") {
            const { nome, email, cpf } = req.body;
            if (!nome || !email || !cpf)
                return res.status(400).json({ error: "Dados incompletos do pagador" });

            const [first_name, ...rest] = nome.trim().split(" ");
            const last_name = rest.join(" ") || "-";

            const paymentData = {
                transaction_amount: 10.0,
                description: "Inscrição RESTART",
                payment_method_id: "pix",
                payer: {
                    email,
                    first_name,
                    last_name,
                    identification: { type: "CPF", number: cpf }
                }
            };

            const responseMP = await fetch(MERCADO_PAGO_API, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": uuidv4()
                },
                body: JSON.stringify(paymentData)
            });

            const data = await responseMP.json();

            if (data.point_of_interaction?.transaction_data) {
                res.status(200).json({
                    id: data.id,
                    qr_code: data.point_of_interaction.transaction_data.qr_code,
                    qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64
                });
            } else {
                res.status(400).json({ error: "QR Code não encontrado", details: data });
            }
            return;
        }

        // =======================
        // ✅ Verificar status do pagamento
        // =======================
        if (url.includes("/check-status") && req.method === "GET") {
            const payment_id = url.split("/check-status/")[1];
            const responseMP = await fetch(`${MERCADO_PAGO_API}/${payment_id}`, {
                headers: { "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
            });
            const data = await responseMP.json();

            // Se aprovado, incrementa contador
            if (data.status === "approved") {
                contador.inscritos = Math.min(contador.inscritos + 1, contador.limite);
                salvarContador(contador);
            }

            res.status(200).json({ status: data.status });
            return;
        }

        // =======================
        // ✅ Enviar para Google Sheets
        // =======================
        if (url.includes("/send-to-sheet") && req.method === "POST") {
            const responseGS = await fetch(
                "https://script.google.com/macros/s/AKfycbz42sRL4NjdvNSgg5itxp0wSn5GoLg6q203EfKevIqRoG-NLNI9BcbzA4NU0WW7Bt26/exec",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(req.body)
                }
            );
            const data = await responseGS.text();
            res.status(200).send(data);
            return;
        }

        res.status(404).json({ error: "Rota não encontrada" });
    } catch (err) {
        console.error("❌ Erro no handler:", err);
        res.status(500).json({ error: "Erro no servidor" });
    }
}
