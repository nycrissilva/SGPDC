import 'dotenv/config';
import jwt from 'jsonwebtoken';
import PessoaRepository from '../repositories/PessoaRepository.js';
import UsuarioRepository from '../repositories/UsuarioRepository.js';
import { hashPassword, comparePassword, isStrongPassword } from '../utils/passwordUtils.js';

const JWT_SECRET = process.env.JWT_SECRET || 'SGPDC_SECRET_2026';
const COOKIE_NAME = 'sgpdc_token';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

export default class AuthController {
    constructor() {
        this.usuarioRepository = new UsuarioRepository();
        this.pessoaRepository = new PessoaRepository();
    }

    async register(req, res) {
        return res.status(403).json({
            error: 'Cadastro isolado de usuário não é permitido. Crie um Funcionário ou um Professor para gerar o usuário automaticamente.',
        });
    }

    async login(req, res) {
        try {
            const { email, senha } = req.body;
            if (!email || !senha) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios' });
            }

            const usuario = await this.usuarioRepository.autenticar(email, senha);
            if (!usuario) {
                return res.status(401).json({ error: 'Email ou senha inválidos' });
            }

            const payload = {
                id: usuario.id,
                pessoa_id: usuario.pessoa_id,
                email: usuario.email,
                perfil: usuario.perfil,
                firstAccess: usuario.primeiro_acesso === true || usuario.primeiro_acesso === 1
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
            res.cookie(COOKIE_NAME, token, {
                httpOnly: true,
                secure: COOKIE_SECURE,
                sameSite: 'lax',
                maxAge: 8 * 60 * 60 * 1000,
            });

            return res.json({ success: true, user: payload, token });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async logout(req, res) {
        try {
            res.clearCookie(COOKIE_NAME, {
                httpOnly: true,
                secure: COOKIE_SECURE,
                sameSite: 'lax',
            });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async changePassword(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Não autenticado' });
            }

            const { oldPassword, newPassword, confirmPassword } = req.body;
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ error: 'oldPassword e newPassword são obrigatórios' });
            }

            if (confirmPassword && newPassword !== confirmPassword) {
                return res.status(400).json({ error: 'As senhas não coincidem' });
            }

            if (!isStrongPassword(newPassword)) {
                return res.status(400).json({
                    error: 'A nova senha deve ter pelo menos 8 caracteres e incluir letras e números',
                });
            }

            if (newPassword === oldPassword) {
                return res.status(400).json({ error: 'A nova senha deve ser diferente da senha atual' });
            }

            const usuario = await this.usuarioRepository.obter(req.user.id);
            if (!usuario) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const senhaAtualValida = await comparePassword(oldPassword, usuario.senha);
            if (!senhaAtualValida) {
                return res.status(401).json({ error: 'Senha atual incorreta' });
            }

            usuario.senha = await hashPassword(newPassword);
            usuario.primeiro_acesso = false;

            const atualizado = await this.usuarioRepository.alterar(usuario);
            if (!atualizado) {
                return res.status(500).json({ error: 'Não foi possível atualizar a senha' });
            }

            const payload = {
                id: usuario.id,
                pessoa_id: usuario.pessoa_id,
                email: usuario.email,
                perfil: usuario.perfil,
                firstAccess: false,
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
            res.cookie(COOKIE_NAME, token, {
                httpOnly: true,
                secure: COOKIE_SECURE,
                sameSite: 'lax',
                maxAge: 8 * 60 * 60 * 1000,
            });

            return res.json({ success: true, user: payload, token });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            const identificador = String(req.body.identificador || req.body.email || req.body.cpf || '').trim();
            const { newPassword, confirmPassword } = req.body;
            if (!identificador || !newPassword) {
                return res.status(400).json({ error: 'Informe CPF ou email e a nova senha' });
            }
            if (confirmPassword && newPassword !== confirmPassword) {
                return res.status(400).json({ error: 'As senhas nÃ£o coincidem' });
            }
            if (!isStrongPassword(newPassword)) {
                return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres e incluir letras e nÃºmeros' });
            }

            const usuario = await this.usuarioRepository.obterPorCpfOuEmail(identificador);
            if (!usuario) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado' });

            usuario.senha = await hashPassword(newPassword);
            usuario.primeiro_acesso = false;
            const atualizado = await this.usuarioRepository.alterar(usuario);
            if (!atualizado) return res.status(500).json({ error: 'NÃ£o foi possÃ­vel redefinir a senha' });

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async profile(req, res) {
        try {
            if (!req.user) return res.status(401).json({ error: 'NÃ£o autenticado' });
            const pessoa = await this.pessoaRepository.obter(req.user.pessoa_id);
            const usuario = await this.usuarioRepository.obter(req.user.id);
            if (!pessoa || !usuario) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado' });
            return res.json({
                id: usuario.id,
                pessoa_id: pessoa.id,
                nome: pessoa.nome,
                cpf: pessoa.cpf,
                telefone: pessoa.telefone,
                email: usuario.email || pessoa.email,
                perfil: usuario.perfil,
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            if (!req.user) return res.status(401).json({ error: 'NÃ£o autenticado' });
            const pessoa = await this.pessoaRepository.obter(req.user.pessoa_id);
            const usuario = await this.usuarioRepository.obter(req.user.id);
            if (!pessoa || !usuario) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado' });

            const email = String(req.body.email || '').trim();
            const telefone = String(req.body.telefone || '').trim();
            const { currentPassword, newPassword, confirmPassword } = req.body;
            if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

            const usuarioMesmoEmail = await this.usuarioRepository.obterPorEmail(email);
            if (usuarioMesmoEmail && usuarioMesmoEmail.id !== usuario.id) {
                return res.status(400).json({ error: 'JÃ¡ existe um usuÃ¡rio com este email' });
            }

            pessoa.email = email;
            pessoa.telefone = telefone || null;
            await this.pessoaRepository.alterar(pessoa);

            usuario.email = email;
            if (newPassword) {
                if (!currentPassword) return res.status(400).json({ error: 'Informe a senha atual para alterar a senha' });
                if (confirmPassword && newPassword !== confirmPassword) return res.status(400).json({ error: 'As senhas nÃ£o coincidem' });
                if (!isStrongPassword(newPassword)) return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres e incluir letras e nÃºmeros' });
                const senhaAtualValida = await comparePassword(currentPassword, usuario.senha);
                if (!senhaAtualValida) return res.status(401).json({ error: 'Senha atual incorreta' });
                usuario.senha = await hashPassword(newPassword);
                usuario.primeiro_acesso = false;
            }
            await this.usuarioRepository.alterar(usuario);

            const payload = {
                id: usuario.id,
                pessoa_id: usuario.pessoa_id,
                email: usuario.email,
                perfil: usuario.perfil,
                firstAccess: usuario.primeiro_acesso === true || usuario.primeiro_acesso === 1,
            };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
            res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: COOKIE_SECURE, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
            return res.json({ success: true, user: payload, token });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async me(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            return res.json({ user: req.user });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
