import nodemailer from "nodemailer";
import path from "path";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Substitua pelo email que você quer testar
const emailDestino = "luizalexandre1029@gmail.com";

async function enviarTeste() {
    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: emailDestino,
            subject: "Inscrição RESTART Confirmada!",
            html: `
                <div style="font-family: 'Montserrat', sans-serif; line-height: 1.5; color: #333;">
                    <p>✨ Sua inscrição na Conferência Restart está confirmada! Prepare-se para viver algo novo!</p>

                    <img src="cid:mensagemIMG" alt="Mensagem" style="max-width: 100%; height: auto; margin: 20px 0;" />

                    <p>Com alegria,<br>
                    Equipe UAADA 2025<br>
                    Essa chama não se apaga e não se apagará. 🔥</p>
                </div>
            `,
            attachments: [
                {
                    filename: "mensagem.jpg",
                    path: path.join(process.cwd(), "mensagem.jpg"), // imagem na raiz do projeto
                    cid: "mensagemIMG"
                }
            ]
        });

        console.log("✅ Email de teste enviado com sucesso!");
    } catch (err) {
        console.error("❌ Erro ao enviar email de teste:", err);
    }
}

enviarTeste();
