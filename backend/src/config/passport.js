import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from './db.js';
import redis from './redis.js';
import { v4 as uuidv4 } from 'uuid';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Ver se o utilizador já existe por Google ID
            const [users] = await db.query(
                `SELECT u.*, r.nome as tipo_utilizador 
                 FROM utilizadores u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE provider_id = ? AND auth_provider = ?`,
                [profile.id, 'google']
            );

            if (users.length > 0) {
                return done(null, users[0]);
            }

            // Ver se existe por Email
            const email = profile.emails[0].value;
            const [existingEmail] = await db.query(
                `SELECT u.*, r.nome as tipo_utilizador 
                 FROM utilizadores u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE email = ?`,
                [email]
            );

            if (existingEmail.length > 0) {
                // Se o email já existir atualizamos o provider_id para permitir login Google
                await db.query(
                    'UPDATE utilizadores SET provider_id = ?, auth_provider = ? WHERE email = ?',
                    [profile.id, 'google', email]
                );
                return done(null, existingEmail[0]);
            }

            // Criar novo Utilizador (Candidato)
            const activation_token = uuidv4();

            // ter o id da role candidato
            const [roles] = await db.query("SELECT id FROM roles WHERE nome = 'CANDIDATO'");
            const role_id = roles[0].id;

            await db.query(
                `INSERT INTO utilizadores 
                (nome_completo, email, role_id, auth_provider, provider_id, is_active, activation_token)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [profile.displayName, email, role_id, 'google', profile.id, true, activation_token]
            );

            // ter o utilizador acabado de criar
            const [finalUsers] = await db.query(
                `SELECT u.*, r.nome as tipo_utilizador 
                 FROM utilizadores u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE email = ?`,
                [email]
            );

            // Limpar cache
            await redis.del('users:all');

            return done(null, finalUsers[0]);

        } catch (err) {
            console.error('Erro no Passport Google:', err);
            return done(err, null);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await db.query(
            `SELECT u.*, r.nome as tipo_utilizador 
             FROM utilizadores u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [id]
        );
        done(null, users[0]);
    } catch (err) {
        done(err, null);
    }
});

export default passport;

