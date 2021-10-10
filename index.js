require("dotenv").config();

const { API_PORT, HOST, PREFIX } = process.env;

const downloads = require('./routes/downloads.js');
const stats = require('./services/stats.js');

const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

const express = require('express');
const app = express();
const router = express.Router();
const cors = require('cors');

const winston = require('winston')
const ecsFormat = require('@elastic/ecs-winston-format')

const logger = winston.createLogger({
    format: ecsFormat(),
    transports: [
        new winston.transports.Console()
    ]
})


const whitelist = [
    `http://nas.thorez.loc/${PREFIX}`,
    `http://nas.thorez.net/${PREFIX}`,
    'http://localhost:4200'];

const corsOptions = {
    origin: function (origin, callback) {
        logger.info(origin)
        if (!origin || whitelist.indexOf(origin) !== -1) {
            logger.info('accepted');
            callback(null, true)
        } else {
            logger.info('refused');
            callback(new Error('Not allowed by CORS'))
        }
    }
}

app.use(cors(corsOptions));


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

swaggerDocument.host = `${HOST}:${API_PORT}/${PREFIX}`;

app.use(`${PREFIX}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(`${PREFIX}/api/v1`, router);

const server = app.listen(API_PORT);