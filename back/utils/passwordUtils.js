import bcrypt from 'bcryptjs';

export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function isStrongPassword(password) {
    return typeof password === 'string' &&
        password.length >= 8 &&
        /[A-Za-z]/.test(password) &&
        /[0-9]/.test(password);
}

export function buildInitialPassword(dataNascimento) {
    if (!dataNascimento) return null;
    
    // Parsar data no formato ISO (YYYY-MM-DD) sem problemas de timezone
    const [year, month, day] = dataNascimento.split('-');
    if (!year || !month || !day) return null;
    
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year);

    return `${dayStr}${monthStr}${yearStr}`;
}
