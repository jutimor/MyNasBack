

const schema = require('./schema.js');

const options = {
    host: '192.168.1.100',
    port: 6800,
    secure: false,
    secret: 'myBigSecret',
    path: '/jsonrpc'
};


const winston = require('winston')
const ecsFormat = require('@elastic/ecs-winston-format')

const logger = winston.createLogger({
    format: ecsFormat(),
    transports: [
        new winston.transports.Console()
    ]
})

const Aria2 = require("aria2");
const aria2 = new Aria2([options]);

function init() {

    aria2.host = options.host;
    aria2.secret = options.secret;
    aria2
        .open()
        .then(async () => {
            logger.info("Connected to aria2 downloader");
        })
        .catch((err) => logger.info("error", err));
}

aria2.on('onDownloadStart', async (params) => {
    logger.info("aria2 onDownloadStart", params[0].gid);
    const result = await aria2.call("tellStatus", params[0].gid, ["gid", "status", "totalLength"]);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'active'
    })
});

aria2.on('onDownloadPause', (params) => {
    logger.info("aria2 onDownloadPause", params);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'pause'
    });
});

aria2.on('onDownloadComplete', (params) => {
    logger.info("aria2 onDownloadComplete", params);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'completed'
    });
});

aria2.on('onDownloadStop', (params) => {
    logger.info("aria2 onDownloadStop", params);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'stop'
    });
});

aria2.on('onDownloadError', (params) => {
    logger.info("aria2 onDownloadError", params);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'error'
    });
});

var updateDownload = async function (status, gid, callback) {
    if (status !== 'delete') {
        try {
            await aria2.call(status, gid);
        } catch (error) {
            this.logger.error(error);
        }
    }
    else {
        schema.deleteDownload(gid, function () {
            logger.info('deleted');
            callback();
        });
    }
}

var addDownload = async function (uri) {
    try {
        const guid = await aria2.call("addUri", [uri], { dir: '/data/' });
        var tmp = uri.split('/');
        const newDownload = {
            name: tmp[tmp.length - 1],
            uri: uri,
            gid: guid
        };

        schema.addDownload(newDownload);

        return guid;
    } catch (error) {
        this.logger.error(error);
        return "";
    }
};

function castAsDownload(item, uri) {
    const download = {};

    download['completedLength'] = item.completedLength;
    download['downloadSpeed'] = item.downloadSpeed;
    download['gid'] = item.gid;
    download['uri'] = uri;
    download['totalLength'] = item.totalLength;
    download['status'] = item.status;
    download['numPieces'] = item.numPieces;
    download['pieceLength'] = item.pieceLength;
    download['percent'] = item.completedLength / item.totalLength;

    return download;
}

var getAllDownloads = async function (callback) {

    var activeDownloads = [];
    try {
        activeDownloads = await aria2.call("tellActive");
    } catch (error) {
        logger.error(error);
    }

    schema.getDownloads(async function (all) {

        for (var i = 0; i < all.length; i++) {
            if (all[i].status !== 'completed' && all[i].status !== 'error') {
                try {
                    const detail = await aria2.call("tellStatus", all[i].gid, [
                        "gid", "status", "completedLength", "totalLength"]);

                    if (all[i].status === 'active' && activeDownloads.find(x => x.gid === all[i].gid)) {
                        logger.info('downloadSpeed', activeDownloads.find(x => x.gid === all[i].gid).downloadSpeed);
                        all[i] = {
                            name: all[i].name,
                            status: all[i].status,
                            gid: all[i].gid,
                            completedLength: detail.completedLength,
                            totalLength: detail.totalLength,
                            downloadSpeed: activeDownloads.find(x => x.gid === all[i].gid).downloadSpeed,
                            percent: detail.completedLength / detail.totalLength
                        };
                    }

                } catch (error) {
                    logger.error(error);
                }

            }
        }
        callback({ items: all, totalItems: all.length });
    });
};

var downloadModule = {
    getAllDownloads,
    addDownload,
    updateDownload
}

init();

module.exports = downloadModule;