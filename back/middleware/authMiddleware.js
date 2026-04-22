import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SGPDC_SECRET_2026';
const COOKIE_NAME = 'sgpdc_token';

export function requireAuth(req, res, next) {
    const token = req.cookies?.[COOKIE_NAME] ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autenticado' });
        }

        if (!allowedRoles.includes(req.user.perfil)) {
            return res.status(403).json({ error: 'Acesso negado para este perfil' });
        }

        return next();
    };
}

export const requireFuncionario = requireRole('FUNCIONARIO');
export const requireProfessor = requireRole('PROFESSOR');
