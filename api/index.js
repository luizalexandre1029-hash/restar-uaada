// import fetch from "node-fetch";
// import { v4 as uuidv4 } from "uuid";

// const MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-2703539769101891-101913-92def06cfd2c7a6fea465c1eeae4150c-702338274";
// const MERCADO_PAGO_API = "https://api.mercadopago.com/v1/payments";

// // ===== Limite global =====
// let totalPixRealizados = 0;
// const LIMITE_PIX = 250;

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
//             if (totalPixRealizados >= LIMITE_PIX) {
//                 return res.status(400).json({
//                     error: "Inscrições para o primeiro lote esgotadas",
//                     vagasRestantes: 0
//                 });
//             }

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
//                 totalPixRealizados += 1;

//                 res.status(200).json({
//                     id: data.id,
//                     qr_code: data.point_of_interaction.transaction_data.qr_code,
//                     qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
//                     vagasRestantes: LIMITE_PIX - totalPixRealizados
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
import nodemailer from "nodemailer";
import path from "path";

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-2703539769101891-101913-92def06cfd2c7a6fea465c1eeae4150c-702338274";
const MERCADO_PAGO_API = "https://api.mercadopago.com/v1/payments";

// ===== Limite global =====
let totalPixRealizados = 0;
const LIMITE_PIX = 250;

// ===== Configuração do Nodemailer usando variáveis de ambiente =====
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// ===== Função para enviar email HTML =====
async function enviarEmail(usuario) {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: usuario.email,
        subject: "Inscrição RESTART Confirmada!",
        html: `
            <div style="font-family: 'Montserrat', sans-serif; line-height: 1.5; color: #333;">
                <p>✨ Olá ${usuario.nome} Sua inscrição na Conferência Restart está confirmada! Prepare-se para viver algo novo!</p>
                
                <img src="cid:mensagemIMG" alt="Mensagem" style="max-width: 100%; height: auto; margin: 20px 0;" />

                <p>Com alegria,<br>
                Equipe UAADA 2025<br>
                Essa chama não se apaga e não se apagará. 🔥</p>
            </div>
        `,
        attachments: [
            {
                filename: "mensagem.jpg",
                path: path.join(process.cwd(), "mensagem.jpg"), // raiz do projeto
                cid: "mensagemIMG"
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Email enviado para", usuario.email);
    } catch (err) {
        console.error("❌ Erro ao enviar email:", err);
    }
}

export default async function handler(req, res) {
    // Permitir CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    const url = req.url;

    try {
        // =========================
        // ✅ Gerar PIX
        // =========================
        if (url.includes("/generate-pix") && req.method === "POST") {
            if (totalPixRealizados >= LIMITE_PIX) {
                return res.status(400).json({
                    error: "Inscrições para o primeiro lote esgotadas",
                    vagasRestantes: 0
                });
            }

            const { nome, email, cpf } = req.body;

            if (!nome || !email || !cpf) {
                return res.status(400).json({ error: "Dados incompletos do pagador" });
            }

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
                totalPixRealizados += 1;

                res.status(200).json({
                    id: data.id,
                    qr_code: data.point_of_interaction.transaction_data.qr_code,
                    qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
                    vagasRestantes: LIMITE_PIX - totalPixRealizados
                });
            } else {
                res.status(400).json({ error: "QR Code não encontrado", details: data });
            }
            return;
        }

        // =========================
        // ✅ Verificar status do pagamento
        // =========================
        if (url.includes("/check-status") && req.method === "GET") {
            const payment_id = url.split("/check-status/")[1];

            const responseMP = await fetch(`${MERCADO_PAGO_API}/${payment_id}`, {
                headers: { "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
            });

            const data = await responseMP.json();

            res.status(200).json({ status: data.status });
            return;
        }

        // =========================
        // ✅ Enviar para Google Sheets e enviar email quando aprovado
        // =========================
        if (url.includes("/send-to-sheet") && req.method === "POST") {
            const usuario = req.body;

            // Enviar para Google Sheets
            const responseGS = await fetch(
                "https://script.google.com/macros/s/AKfycbz42sRL4NjdvNSgg5itxp0wSn5GoLg6q203EfKevIqRoG-NLNI9BcbzA4NU0WW7Bt26/exec",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(usuario)
                }
            );
            const dataGS = await responseGS.text();

            // Enviar email
            await enviarEmail(usuario);

            res.status(200).send(dataGS);
            return;
        }

        res.status(404).json({ error: "Rota não encontrada" });

    } catch (err) {
        console.error("❌ Erro no handler:", err);
        res.status(500).json({ error: "Erro no servidor" });
    }
}
