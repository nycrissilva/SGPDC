import express from 'express'
import cors from 'cors'

import alunoRoutes from './routes/alunoRoutes.js'
import responsavelRoutes from './routes/responsavelRoutes.js'
import professorRoutes from './routes/professorRoutes.js'
import funcionarioRoutes from './routes/funcionarioRoutes.js'
import turmaRoutes from './routes/turmaRoutes.js'

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
    }
}))
app.use(express.json())

app.use('/api/alunos', alunoRoutes)
app.use('/api/responsaveis', responsavelRoutes)
app.use('/api/professores', professorRoutes)
app.use('/api/funcionario', funcionarioRoutes)
app.use('/api/turmas', turmaRoutes)

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
})



app.listen(PORT, () => {
    console.log(`Servidor SGPDC rodando na porta http://localhost:5001`)
})
