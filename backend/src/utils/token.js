import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.tipo_utilizador 
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
};
