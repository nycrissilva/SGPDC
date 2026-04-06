import express from 'express'
import cors from 'cors'
import alunoRoutes from './routes/alunoRoutes.js'
import responsavelRoutes from './routes/responsavelRoutes.js'
import professorRoutes from './routes/professorRoutes.js'
import funcionarioRoutes from './routes/funcionarioRoutes.js'

const app = express()
const PORT = 5001

app.use(cors({ origin: 'http://localhost:5000' }))
app.use(express.json())

app.use('/api/alunos', alunoRoutes)
app.use('/api/responsaveis', responsavelRoutes)
app.use('/api/professores', professorRoutes)
app.use('/api/funcionario', funcionarioRoutes)

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.listen(PORT, () => {
    console.log(`Servidor SGPDC rodando na porta http://localhost:5001`)
})
