var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');
var request = require('request');
var bodyParser = require('body-parser');
var	Disposal = require('./Utils/disposal'),
    Constant = require('./Utils/constant');

var PartyModel = require('./models/Party').Party,
	SongModel = require('./models/Party').Song;

//set port
//app.set('port', normalizePort(process.env.PORT || '3000'));

// Connect to database
var mongoURI = "mongodb://dualranger:hack2015@ds031892.mongolab.com:31892/jukebox",
	mongooseURI = uriUtil.formatMongoose(mongoURI);
mongoose.connect(mongooseURI);

// MIDDLEWARE
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Set up socket.io
var io = require('socket.io')(http);
io.on('connection', function(socket) {
	var party_handler = require('./sockets/party_socket.js');
	party_handler.linkSocket(io, socket); // Allows party_handler to us io and socket

	console.log('SOCKET CONNECTED');
	// Socket Event listeners
	socket.on('playlist-request', party_handler.hostParty);
	socket.on('guest-join', party_handler.guestJoin);
	socket.on('queue-update', party_handler.udpateQueue);
	socket.on('song-end', party_handler.endSong);

	socket.on('disconnect', function() {
		console.log('SOCKET DISCONNECTED');
	});
});

// ROUTING
app.post('/userauth', function(req, res, next) {
	var user_id = req.body.user_id,
		auth_key = req.body.token;
	console.log("USER ID:" + user_id);
	console.log("AUTH KEY: " + auth_key);
	// Set up GET request
	var _headers = {
		'Authorization': 'Bearer ' + auth_key
	};
	var options = {
		url: 'https://api.spotify.com/v1/users/'+ user_id +'/playlists',
		method: 'GET',
		headers: _headers
	};
	// This requests the playlist information for a user with 
	// user id: user_id and authentication key: auth_key
	return request(options, function(err, resp, body) {
		if(!err) {
			body = JSON.parse(body);
			var playlists = parsePlaylists(body.items);
			res.send(playlists); // playlists is an array. see parsePlaylists()
		}else {
			console.log(err);
		}
		res.end();
	});
});

// Party garbage collection
var CronJob = require('cron').CronJob;
var job = new CronJob('*/180 * * * * *', function() {
	// Code in here will be called after a given time, on scheduled basis
	console.log("CLEANING UP AFTER PARTIES");
	Disposal();
});
job.start();


http.listen(process.env.PORT || 3000, function() {
	console.log("listening on port:" + process.env.PORT);
});

/*
 * Function that returns an array of objects containing: 
 * { name, id , image_url } for each playlist in lists
 */
var parsePlaylists = function(lists) {
	var result = [];
	for(var i = 0; i < lists.length; i++) {
		result.push({ 
			name: lists[i].name,
			id: lists[i].id,
			image_url: lists[i].images[0].url
		});
	};
	return result;
};
