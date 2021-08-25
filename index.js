require("dotenv").config();

const { API_PORT, HOST } = process.env;

const downloads = require('./routes/downloads.js');
const stats = require('./services/stats.js');

const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

const express = require('express');
const app = express();
const router = express.Router();
const cors = require('cors');

app.use(cors());

app.use(express.json());

router.route('/downloads')
    .post(downloads.addDownload)
    .get(downloads.getAllDownloads)
    .put(downloads.updateStatus)
    ;

router.route('/stats')
    .get(stats.statReport)
    ;

router.route('/temperature')
    .get(stats.temperature)
    ;

swaggerDocument.host = `${HOST}:${API_PORT}`

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', router);

const server = app.listen(API_PORT);