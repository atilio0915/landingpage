const express = require('express');
const app = express();
const port = 5500;
const mysql = require ('mysql2');
// Middleware para processar JSON
app.use(express.json()); // Para que o servidor possa entender JSON

// Rota para lidar com a solicitação POST
app.post('/submit', (req, res) => {
    res.send('formulario recebido')
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://127.0.0.1:${port}`);
});
//configuraçao da conexão do banccco
const connection = mysql.createConnection({
    host:'127.0.0.1',
    user:'root',
    password: '58627094',
    database: 'banco'
});

//conectar e verificar o banco

connection.connect((err) =>{
    if(err){
        console.error('conexao falhou', err.stack);
        return
    } 
    console.log('conexão estabelecida com sucesso');
});


