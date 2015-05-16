var app = require('express')();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');

var PartyModel = require('./models/Party').Party,
	SongModel = require('./models/Party').Song;

//connect to database
var mongoURI = "mongodb://dualranger:hack2015@ds031892.mongolab.com:31892/jukebox",
	mongooseURI = uriUtil.formatMongoose(mongoURI);
mongoose.connect(mongooseURI);

//Set up socket.io
var io = require('socket.io')(http);
io.on('connection', function(socket) {
	console.log('server connected');
});

app.post('/userauth', function(req, res, next) {
	return console.log(req.body);
});


http.listen(3000, function() {
	console.log("listening on port 3000");
});