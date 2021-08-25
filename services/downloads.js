

const schema = require('./schema.js');

const options = {
    host: '192.168.1.100',
    port: 6800,
    secure: false,
    secret: 'myBigSecret',
    path: '/jsonrpc'
};

const Aria2 = require("aria2");
const aria2 = new Aria2([options]);

function init() {

    aria2.host = options.host;
    aria2.secret = options.secret;
    aria2
        .open()
        .then(async () => {
            console.log("Connected to aria2 downloader");
        })
        .catch((err) => console.log("error", err));
}

aria2.on('onDownloadStart', async (params) => {
    console.log("aria2 onDownloadStart", params[0].gid);
    const result = await aria2.call("tellStatus", params[0].gid, ["gid", "status", "totalLength"]);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'active'
    })
});

aria2.on('onDownloadPause', (params) => {
    console.log("aria2 onDownloadPause", params);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'pause'
    });
});

aria2.on('onDownloadComplete', (params) => {
    console.log("aria2 onDownloadComplete", params);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'completed'
    });
});

aria2.on('onDownloadStop', (params) => {
    console.log("aria2 onDownloadStop", params);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'stop'
    });
});

aria2.on('onDownloadError', (params) => {
    console.log("aria2 onDownloadError", params);
    schema.updateDownloadStatus({
        gid: params[0].gid,
        status: 'error'
    });
});

var updateDownload = async function (status, gid, callback) {
    if (status !== 'delete') {
        await aria2.call(status, gid);
    }
    else {
        schema.deleteDownload(gid, function () {
            console.log('deleted');
            callback();
        });
    }
}

var addDownload = async function (uri) {

    const guid = await aria2.call("addUri", [uri], { dir: '/raid/share/Telechargements/' });
    var tmp = uri.split('/');
    const newDownload = {
        name: tmp[tmp.length - 1],
        uri: uri,
        gid: guid
    };

    schema.addDownload(newDownload);

    return guid;
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

    var activeDownloads = await aria2.call("tellActive");
    schema.getDownloads(async function (all) {

        for (var i = 0; i < all.length; i++) {
            if (all[i].status !== 'completed' && all[i].status !== 'error') {
                const detail = await aria2.call("tellStatus", all[i].gid, [
                    "gid", "status", "completedLength", "totalLength"]);

                if (all[i].status === 'active' && activeDownloads.find(x => x.gid === all[i].gid)) {
                    console.log('downloadSpeed', activeDownloads.find(x => x.gid === all[i].gid).downloadSpeed);
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