import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Forçar SSL/TLS porto 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendActivationEmail = async (email, token) => {
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const activationLink = `${appUrl}/api/auth/activate?token=${token}`;

    const mailOptions = {
        from: `"Academy Manager" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Ativação de Conta - Academy Manager',
        html: `
      <h1>Bem-vindo ao Academy Manager!</h1>
      <p>Clique no link abaixo para ativar a sua conta:</p>
      <a href="${activationLink}">Ativar Minha Conta</a>
      <p>Se não se registou no nosso sistema, ignore este email.</p>
    `
    };

    console.log('Link de Ativação (DEV):', activationLink);
    return transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
        from: `"Academy Manager" <${process.env.EMAIL_USER}>`,
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

    console.log('Link de Reset (DEV):', resetLink);
    return transporter.sendMail(mailOptions);
};

export const send2FADisableEmail = async (email, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const disableLink = `${frontendUrl}/disable-2fa?token=${token}`;

    const mailOptions = {
        from: `"Academy Manager" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Desativar 2FA - Academy Manager',
        html: `
        <h1>Pedido para Desativar 2FA</h1>
        <p>Recebemos um pedido para remover a autenticação de dois fatores da sua conta.</p>
        <p>Se perdeu o acesso ao seu autenticador, clique no link abaixo para desativar o 2FA:</p>
        <a href="${disableLink}">Desativar 2FA</a>
        <p>Se não pediu isto, ignore este email e a sua conta permanecerá segura.</p>
      `
    };

    console.log('Link de Desativação 2FA (DEV):', disableLink);
    return transporter.sendMail(mailOptions);
};
