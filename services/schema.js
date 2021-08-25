const data = require('../core/data.js');

const addDownload = (newDownload) => {
    const NewDownload = new data.Download({ ...newDownload, startedAt: new Date() });

    NewDownload.save(function (err, addedDownload) {
        if (err) return console.error(err);
        console.log(addedDownload._id);
    });
}

const updateDownloadStatus = (download) => {

    const query = data.Download.where({ gid: download.gid });
    query.findOne(function (err, foundDownload) {
        if (err) return handleError(err);
        if (foundDownload) {
            // doc may be null if no document matched
            foundDownload.status = download.status;
            if (download.status === 'completed') {
                foundDownload.finishedAt = new Date();
            }
            foundDownload.save(function (err, addedDownload) {
                if (err) return console.error(err);
                console.log(addedDownload._id);
            });
        };
    });
}

const getDownloads = (callback) => {
    const query = data.Download.where({});
    query.find(function (err, foundDownloads) {
        if (err) {
            callback([]);
            return handleError(err);
        }
        if (foundDownloads) {
            callback(foundDownloads);
        };
    });
}

const deleteDownload = (gid, callback) => {
    const query = data.Download.where({ gid });
    console.log(gid);
    query.deleteOne(function (err, foundDownloads) {
        if (err) {
            return handleError(err);
        }

        callback();
    })
}

var schema = {
    getDownloads,
    addDownload,
    updateDownloadStatus,
    deleteDownload
};

module.exports = schema