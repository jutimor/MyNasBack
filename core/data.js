const mongoose = require('mongoose');
const { MONGO_URI } = process.env;
mongoose.connect(MONGO_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
    });

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