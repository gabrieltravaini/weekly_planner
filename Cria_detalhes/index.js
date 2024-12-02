const express = require('express');
const app = express();
app.use(express.json());

app.post('/eventos', (req, res) => {
    console.log(req.body);
    res.send({ msg: 'ok' });
})

app.listen(4000, () => {
    console.log('Lembretes. Porta 4000');
});