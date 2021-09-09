var os = require('os-utils');
var _os = require('os');
const { exec } = require("child_process");


const winston = require('winston')
const ecsFormat = require('@elastic/ecs-winston-format')

const logger = winston.createLogger({
    format: ecsFormat(),
    transports: [
        new winston.transports.Console()
    ]
})

var statReport = function (req, res, next) {
    const report = {};

    report['freemem'] = os.freemem();
    report['totalmem'] = os.totalmem();

    var cpus = _os.cpus();

    const cpuName = cpus[0].model;
    const totalIdle = cpus.reduce((t, { times }) => t + times.idle, 0);
    const totalNice = cpus.reduce((t, { times }) => t + times.nice, 0);
    const totalSys = cpus.reduce((t, { times }) => t + times.sys, 0);
    const totalIrq = cpus.reduce((t, { times }) => t + times.irq, 0);
    const totalUser = cpus.reduce((t, { times }) => t + times.user, 0);

    const usage = (totalIdle) / (totalIdle + totalNice + totalSys + totalIrq + totalUser);

    logger.info(cpuName + ' Usage (%): ' + (1 - usage));
    report['cpuName'] = cpuName;
    report['cpuUsage'] = 1 - usage;

    report['upTime'] = os.sysUptime();

    res.send(report);
}

var temperature = (req, res, next) => {
    exec("sensors -j", (error, stdout, stderr) => {
        if (error) {
            logger.info(`error: ${error.message}`);
            return res.send({});
        }
        if (stderr) {
            logger.info(`stderr: ${stderr}`);
            return res.send({});
        }

        return res.send(stdout);
    });
}




var stats = {
    statReport,
    temperature
};

module.exports = stats