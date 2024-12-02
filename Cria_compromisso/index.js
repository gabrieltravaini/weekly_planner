require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const mysql = require('mysql2');

const app = express();
const port = 3000;

const { DB_USER, DB_PASSWORD, DB_HOST, DB_DB, DB_PORT, AWS_KEY, AWS_SECRET_KEY, AWS_REGION,AWS_EVENT_BUS } = process.env;


const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    database: DB_DB,
    password: DB_PASSWORD,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(express.json());

AWS.config.update({
    accessKeyId: AWS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
    region: AWS_REGION
});

const eventBridge = new AWS.EventBridge();

app.post('/compromissos', (req, res) => {
    const ds_compromisso = req.body.ds_compromisso;
    const dt_compromisso = req.body.dt_compromisso;
    const hr_compromisso = req.body.hr_compromisso;

    const sql = "INSERT INTO tb_compromisso (ds_compromisso, dt_compromisso, hr_compromisso) VALUES (?,?,?)";
    pool.query(sql, [ds_compromisso, dt_compromisso, hr_compromisso], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao criar compromisso');
        }

        const params = {
            Entries: [
                {
                    Source: 'planner de compromissos',
                    DetailType: 'CompromissoCriado',
                    Detail: JSON.stringify({ ds_compromisso, dt_compromisso, hr_compromisso }),
                    EventBusName: AWS_EVENT_BUS
                }
            ]
        };

        eventBridge.putEvents(params, function (err, data) {
            if (err) {
                console.error("Erro ao enviar evento", err);
                return res.status(500).send("Erro ao enviar evento");
            } else {
                console.log("Evento enviado", data);
                return res.status(201).send("Lembrete criado e evento enviado");
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
