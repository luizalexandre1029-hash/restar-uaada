import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email não fornecido" });

    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Teste de Email - UAADA",
            text: "✅ Este é um email de teste enviado pelo backend da Vercel!"
        });
        console.log("✅ Email de teste enviado para", email);
        res.status(200).json({ message: "Email de teste enviado com sucesso!" });
    } catch (err) {
        console.error("❌ Erro ao enviar email de teste:", err);
        res.status(500).json({ error: "Erro ao enviar email", details: err.message });
    }
}
