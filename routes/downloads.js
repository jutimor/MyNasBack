var downloadsService = require('../services/downloads.js');

var updateStatus = async function (req, res, next) {
    downloadsService.updateDownload(req.body.status, req.body.gid, function (result) {
        res.sendStatus(200);
        res.end();
    });
};



var getAllDownloads = function (req, res, next) {
    downloadsService.getAllDownloads(function (result) {
        res.send(result);
    });
};

var addDownload = async function (req, res, next) {
    var guid = downloadsService.addDownload(req.body.uri);
    res.send(req.query.uri + ' put to download with guid : ' + guid);
};

var downloadModule = {
    updateStatus,
    getAllDownloads,
    addDownload
}

module.exports = downloadModule;