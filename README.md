Sistema de Venda de Ingressos
Este projeto foi usado para treinar e consolidar conhecimentos em HTML, CSS e JavaScript, Tailwind.
LandigPage para venda de ingressos de cinema com integraÇão ao Mercado Pago.

Funcionalidades
- Venda de ingressos online
- Pagamento via Mercado Pago
- GeraÇõÇœo de ingresso em PDF

Pre-requisitos
- Node.js (LTS recomendado)
- npm (instalado com o Node.js)
- PostgreSQL
- Conta Mercado Pago (token de acesso)
- ngrok (para receber webhook local)

Instalacao
1. npm install
2. Configure o arquivo .env com as variaveis do projeto (PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, MP_ACCESS_TOKEN)

Executar
Desenvolvimento (Tailwind CSS em modo watch): npm run dev
Servidor: node server/server.js

Criação da tabela
CREATE TABLE ingressos (
  id SERIAL PRIMARY KEY,
  dia VARCHAR(20) NOT NULL,
  hora VARCHAR(10) NOT NULL,
  quantidade_inteira INT NOT NULL,
  quantidade_meia INT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  assento VARCHAR(20) NOT NULL,
  pago BOOLEAN NOT NULL DEFAULT false,
  data_pagamento TIMESTAMP NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  codigo VARCHAR(64) DEFAULT NULL
);

Tecnologias
- Node.js
- Express
- PostgreSQL
- HTML, CSS, JavaScript
- Tailwind CSS
- API Mercado Pago
- ngrok

Liink gitPages 
https://atilio0915.github.io/landingpage/
