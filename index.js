var app = require('express')();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');
var request = require('request');

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
	var user_id = req.body.user_id,
		auth_key = req.body.token;
	
	console.log("USER ID:" + user_id);
	console.log("AUTH KEY" + auth_key);
	//set up request to get playlist from spotify
	/*var _headers = {
		'Authentication': 'Bearer' + auth_key
	};
	var options = {
		url: 'https://api.spotify.com/v1/users/'+ user_id +'/playlists',
		method: 'GET',
		headers: _headers
	};
	return request(options, function(err, res, body) {
		if(!err) {
			console.log(body);
		}else {
			console.log(err);
		}
	});*/

	//return console.log(req.body);
});


http.listen(3000, function() {
	console.log("listening on port 3000");
});