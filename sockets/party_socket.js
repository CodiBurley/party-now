var request = require('request');
var mongoose = require('mongoose'),
	PartyModel = require('../models/Party').Party;

var io = null,
	socket = null;

module.exports = {

	joinParty: function(res) {
		var user_id = res.user_id,
			auth_key = res.token;
			console.log(user_id);
			console.log(auth_key);
		//set up request to get playlist from spotify
		var _headers = {
			'Authorization': 'Bearer ' + auth_key
		};
		var options = {
			url: 'https://api.spotify.com/v1/users/'+ user_id +'/playlists/' + res.list_id + '/tracks' ,
			method: 'GET',
			headers: _headers
		};
		return request(options, function(err, res, body) {
			if(!err) {
				body = JSON.parse(body);
				console.log(body);
				/*var tracks = parseTracks(body.items);
				for(var i = 0; i < tracks.length; i++){
					console.log("Title: " + tracks.title);
					console.log("Artist: " + tracks.artist);
					console.log("Art: " + tracks.art);
					console.log("URI: " + tracks.URI);
				}*/
				//TODO, get Title, artist, and URI
			}else {
				console.log(err);
			}
		});		

		/*var party_query = PartyModel.findOne({ 'name' : res.party }, function(err, results) {
			socket.join(res.party); //the room must be joined regardless

			if(!results) {                      //if a party with the name given is not found,
				var newParty = new PartyModel({ //then make a party with that name
					name: res.party
				});
				newParty.save(function(err) {
					if(err) { return console.log(err); }
				});
			}
			return io.to(results.name).emit('queueReturn', {
						
			})
			
		})*/
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



