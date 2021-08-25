const mongoose = require('mongoose');
mongoose.connect('mongodb://MyNasAdmin:MyNasAdminP%40ss@192.168.1.100:27017/MyNas', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to mongo');
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