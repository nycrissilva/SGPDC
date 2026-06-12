import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import alunoRoutes from './routes/alunoRoutes.js'
import responsavelRoutes from './routes/responsavelRoutes.js'
import professorRoutes from './routes/professorRoutes.js'
import funcionarioRoutes from './routes/funcionarioRoutes.js'
import turmaRoutes from './routes/turmaRoutes.js'
import presencaRoutes from './routes/presencaRoutes.js'
import authRoutes from './routes/authRoutes.js'
import modalidadeRoutes from './routes/modalidadeRoutes.js'
import localRoutes from './routes/localRoutes.js'
import planoMensalidadeRoutes from './routes/planoMensalidadeRoutes.js'
import planoFinanceiroRoutes from './routes/planoFinanceiroRoutes.js'
import mensalidadeRoutes from './routes/mensalidadeRoutes.js'
import periodoLetivoRoutes from './routes/periodoLetivoRoutes.js'
import vendaRoutes from './routes/vendaRoutes.js'
import despesaRoutes from './routes/despesaRoutes.js'
import relatorioFinanceiroRoutes from './routes/relatorioFinanceiroRoutes.js'
import espetaculoRoutes from './routes/espetaculoRoutes.js'
import coreografiaRoutes from './routes/coreografiaRoutes.js'
import { requireAuth } from './middleware/authMiddleware.js'

const app = express()
const PORT = Number(process.env.PORT || 5001)
const HOST = process.env.HOST || '0.0.0.0'
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(cors((req, callback) => {
    const origin = req.get('origin')
    const forwardedHost = req.get('x-forwarded-host')?.split(',')[0].trim()
    const requestHost = forwardedHost || req.get('host')
    const allowed = [
        'http://localhost:5000',
        'https://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:8082',
        ...allowedOrigins,
    ]

    let samePublicHost = false
    if (origin && requestHost) {
        try {
            samePublicHost = new URL(origin).host === requestHost
        } catch {
            samePublicHost = false
        }
    }

    const isAllowed = !origin ||
        allowed.includes(origin) ||
        samePublicHost ||
        /^http:\/\/172\.17\.17\.188(?::\d+)?$/.test(origin) ||
        /https:\/\/.*\.ngrok\.(free\.app|io|free\.dev)$/.test(origin)

    if (!isAllowed) return callback(new Error('Origin not allowed by CORS'))
    callback(null, { origin: true, credentials: true })
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
})

// Aplicar middleware de autenticação para todas as rotas de API, exceto auth
app.use('/api', requireAuth)

app.use('/api/alunos', alunoRoutes)
app.use('/api/responsaveis', responsavelRoutes)
app.use('/api/professores', professorRoutes)
app.use('/api/funcionario', funcionarioRoutes)
app.use('/api/turmas', turmaRoutes)
app.use('/api/presencas', presencaRoutes)
app.use('/api/modalidades', modalidadeRoutes)
app.use('/api/locais', localRoutes)
app.use('/api/planos-mensalidade', planoMensalidadeRoutes)
app.use('/api/planos-financeiros', planoFinanceiroRoutes)
app.use('/api/mensalidades', mensalidadeRoutes)
app.use('/api/periodos-letivos', periodoLetivoRoutes)
app.use('/api/vendas', vendaRoutes)
app.use('/api/despesas', despesaRoutes)
app.use('/api/relatorios-financeiros', relatorioFinanceiroRoutes)
app.use('/api/espetaculos', espetaculoRoutes)
app.use('/api/coreografias', coreografiaRoutes)

app.listen(PORT, HOST, () => {
    console.log(`Servidor SGPDC rodando em http://${HOST}:${PORT}`)
})
