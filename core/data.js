const mongoose = require('mongoose');
const { MONGO_URI } = process.env;


const winston = require('winston')
const ecsFormat = require('@elastic/ecs-winston-format')

const logger = winston.createLogger({
    format: ecsFormat(),
    transports: [
        new winston.transports.Console()
    ]
})


mongoose.connect(MONGO_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    logger.info('connected to mongo');
});

const downloadSchema = new mongoose.Schema({
    name: String,
    uri: String,
    gid: String,
    totalLength: String,
    status: String,
    startedAt: Date,
    finishedAt: Date
});

const Download = mongoose.model('Download', downloadSchema);

module.exports = {
    Download
}