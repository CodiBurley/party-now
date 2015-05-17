var request = require('request');
var mongoose = require('mongoose'),
	PartyModel = require('../models/Party').Party,
	SongModel = require('../models/Party').Song;

var io = null,
	socket = null;

module.exports = {

	hostParty: function(res) {
		var user_id = res.user_id,
			auth_key = res.token;
		//set up request to get playlist from spotify
		var _headers = {
			'Authorization': 'Bearer ' + auth_key
		};
		var options = {
			url: 'https://api.spotify.com/v1/users/'+ user_id +'/playlists/' + res.list_id + '/tracks' ,
			method: 'GET',
			headers: _headers
		};
		request(options, function(err, resp, body) {
			if(!err) {
				body = JSON.parse(body);
				var tracks = parseTracks(body.items);
				//creating party to save songs to, songs get sent to app in saveSongs()
				PartyModel.findOne({ 'name' : res.party }, function(err, results) {
					socket.join(res.party); //the room must be joined regardless
					var uriArray = getURIs(tracks);
					if(!results) {                      //if a party with the name given is not found,
						var newParty = new PartyModel({ //then make a party with that name
							name: res.party,
							queue: uriArray
						});

						newParty.save(function(err) {
							if(err) { return console.log(err); }
							else { return saveSongs(tracks, newParty.id, res.party); }
						});
					}					
				});
			}else {
				console.log(err);
			}
		});		
	},

	guestJoin: function(res) {
		PartyModel.findOne({ 'name': res.party }, function(err, results) {
			var queue = results.queue,
				result = [];
			for(var i = 0; i < queue.length; i++) {
				SongModel.findOne({ 'URI': queue[i], 'party': results.id }, function(err, results) {
					if(err) { return console.log('ERROR FINDING SONGS: ' + err)}
					result.push({
						name: results.name,
						artist: results.artist,
						URI: results.URI,
						art:results.art
					});
				});
				if(i == queue.length - 1) {
					 return io.to(res.party).emit('init-guest', result);
				}
			}
		});
	},

	testReturn: function(res) {
		console.log("party: " + res.party);
		console.log("playlist id: " + res.list_id);
		console.log("token: " +  res.token);
		console.log("user id: " + res.user_id);
	},

	linkSocket: function(_io, _socket) {
		socket = _socket;
		io = _io;
	}

}

var parseTracks = function(tracks) {
	var result = [];
	for(var i = 0; i < tracks.length; i++) {
		result.push({
			title: tracks[i].track.name,
			artist: tracks[i].track.artists[0].name,
			art: tracks[i].track.album.images[0].url,
			URI: tracks[i].track.uri
		});
	}
	return result;
}

var getURIs = function(tracks) {
	var result = [];
	for(var i = 0; i < tracks.length; i++) {
		result.push(tracks[i].URI);
	}
	return result;
}

var saveSongs = function(tracks, party_id, party_name) {
	var result = [];
	io.emit('init-queue', result);
	for(var i = 0; i < tracks.length; i++) {
		var newSong = new SongModel({
			party: party_id,
			name: tracks[i].title,
			artist: tracks[i].artist,
			URI: tracks[i].URI,
			art: tracks[i].art,
		});
		result.push({
			name: tracks[i].title,
			artist: tracks[i].artist,
			URI: tracks[i].URI,
			art: tracks[i].art,			
		});
		newSong.save(function(err) {
			if(err) {
				console.log(err);
			}else if(i == tracks.length - 1) {
				console.log("READY TO EMIT QUEUE*********");
				io.emit('init-queue', result);
			} 
		});
	}
};












