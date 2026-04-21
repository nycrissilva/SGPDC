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
import { requireAuth } from './middleware/authMiddleware.js'

const app = express()
const PORT = 5001

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        const allowed = [
            'http://localhost:5000',
            'https://localhost:5000',
        ]
        if (allowed.includes(origin) || /https:\/\/.*\.ngrok\.(free\.app|io|free\.dev)$/.test(origin)) {
            return callback(null, true)
        }
        callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true,
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

app.listen(PORT, () => {
    console.log(`Servidor SGPDC rodando na porta http://localhost:5001`)
})
