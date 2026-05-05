const express = require('express');
const bodyParser = require('body-parser');
const verificar = require('./netlify/functions/verificar/index.js');

const app = express();
app.use(bodyParser.json());

app.post('/verificar', async (req, res) => {
  const event = {
    httpMethod: req.method,
    body: JSON.stringify(req.body)
  };
  try {
    const result = await verificar.handler(event);
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
