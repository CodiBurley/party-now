var app = require('express')();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');
var request = require('request');
var bodyParser = require('body-parser');

var PartyModel = require('./models/Party').Party,
	SongModel = require('./models/Party').Song;

//connect to database
var mongoURI = "mongodb://dualranger:hack2015@ds031892.mongolab.com:31892/jukebox",
	mongooseURI = uriUtil.formatMongoose(mongoURI);
mongoose.connect(mongooseURI);

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Set up socket.io
var io = require('socket.io')(http);
io.on('connection', function(socket) {
	console.log('server connected');
});

app.post('/userauth', function(req, res, next) {
	var user_id = req.body.user_id,
		auth_key = req.body.token;
	console.log("USER ID:" + user_id);
	console.log("AUTH KEY: " + auth_key);
	//set up request to get playlist from spotify
	var _headers = {
		'Authorization': 'Bearer ' + auth_key
	};
	var options = {
		url: 'https://api.spotify.com/v1/users/'+ user_id +'/playlists',
		method: 'GET',
		headers: _headers
	};
	return request(options, function(err, resp, body) {
		if(!err) {
			console.log(body);

		}else {
			console.log(err);
		}
		res.end();
	});
});


http.listen(process.env.PORT || 3000, function() {
	console.log("listening ");
});