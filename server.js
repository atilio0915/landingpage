const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5500;

app.use(cors());
// Middleware para processar JSON
app.use(bodyParser.json()); // Para que o servidor possa entender JSON

// Configuração da conexão do banco
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '58627094',
    database: 'banco'
});

// Conectar e verificar o banco
connection.connect((err) => {
    if (err) {
        console.error('Conexão falhou', err.stack);
        return;
    }
    console.log('Conexão estabelecida com sucesso');
});

// Rota para lidar com a solicitação POST
app.post('/submit', (req, res) => {
    const { data, hora, quantidadeinteira, quantidademeia } = req.body;
    
    // Aqui eu estou escrevendo o que eu vou inserir na tabela
    const sqlconsulta = 'INSERT INTO ingressos (dia, hora, quantidade_inteira, quantidade_meia) VALUES (?, ?, ?, ?)';

    // Esse array substitui o valor do ? na consulta
    connection.execute(sqlconsulta, [data, hora, quantidadeinteira, quantidademeia], (err, results) => {
        if (err) {
            console.error('Falha ao enviar', err);
            return res.status(500).json({ message: 'Erro ao inserir dados' });
        }
        console.log('Dados recebidos', results);
        res.json({ message: 'Dados recebidos' }); // Envia resposta após inserção bem-sucedida
    });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://127.0.0.1:${port}`);
});