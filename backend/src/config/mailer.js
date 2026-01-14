import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendActivationEmail = async (email, token) => {
    const activationLink = `http://localhost:3001/api/auth/activate?token=${token}`;

    const mailOptions = {
        from: '"Academy Manager" <noreply@atec.pt>',
        to: email,
        subject: 'Ativação de Conta - Academy Manager',
        html: `
      <h1>Bem-vindo ao Academy Manager!</h1>
      <p>Clique no link abaixo para ativar a sua conta:</p>
      <a href="${activationLink}">Ativar Minha Conta</a>
      <p>Se não se registou no nosso sistema, ignore este email.</p>
    `
    };

    return transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    const mailOptions = {
        from: '"Academy Manager" <noreply@atec.pt>',
        to: email,
        subject: 'Recuperação de Password - Academy Manager',
        html: `
        <h1>Recuperação de Password</h1>
        <p>Recebemos um pedido para repor a sua password.</p>
        <p>Clique no link abaixo para escolher uma nova password:</p>
        <a href="${resetLink}">Recuperar Password</a>
        <p>Este link expirará em breve.</p>
      `
    };

    return transporter.sendMail(mailOptions);
};
