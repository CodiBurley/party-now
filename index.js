var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');
var request = require('request');
var bodyParser = require('body-parser');
var Util = require('./Utils/util'),
	Disposal = require('./Utils/disposal');
    Constant = require('./Utils/constant');

var PartyModel = require('./models/Party').Party,
	SongModel = require('./models/Party').Song;

//set port
//app.set('port', normalizePort(process.env.PORT || '3000'));

// Connect to database
var mongoURI = "mongodb://dualranger:hack2015@ds031892.mongolab.com:31892/jukebox",
	mongooseURI = uriUtil.formatMongoose(mongoURI);
mongoose.connect(mongooseURI);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Set up socket.io
var io = require('socket.io')(http);
io.on('connection', function(socket) {
	var party_handler = require('./sockets/party_socket.js');
	party_handler.linkSocket(io, socket);

	console.log('SOCKET CONNECTED');
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
			console.log("TYPE: " + typeof body);
			body = JSON.parse(body);
			var playlists = parsePlaylists(body.items);
			res.send(playlists); //sends array of names, ids, and img urls
		}else {
			console.log(err);
		}
		res.end();
	});
});

// Party garbage collection
var CronJob = require('cron').CronJob;
var job = new CronJob('*/180 * * * * *', function() {
	console.log("CLEANING UP AFTER PARTIES");
	//collectParties();
	Disposal();
});
job.start();


http.listen(process.env.PORT || 3000, function() {
	console.log("listening on port:" + process.env.PORT);
});

/*
 *function that returns array of objects containing 
 *a name and id for a playlist for each playlist
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

/*
 * A function that  deletes all the Parties that have been
 * active for a certain amount of hours
 */
var collectParties = function() {
	PartyModel.find(function(err, results) {
		for(var i = 0; i < results.length; i++) {
			if( partyExpired(results[i].timestamp) ) { results[i].remove() };
		}
	});
}

var partyExpired = function(party) {
	var current = Util.stampTime();
	if(current.day != party.day) {
		current.hour += 24;
	}
	if(current.hour - party.hour >= Constant.PARTY_TIMEOUT) {
		return true;
	}
	return false;
}
