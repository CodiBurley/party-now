var request = require('request');
var mongoose = require('mongoose'),
	PartyModel = require('../models/Party').Party,
	SongModel = require('../models/Party').Song;

var io = null,
	socket = null;

module.exports = {

	hostParty: function(res) {
		console.log("PLAYLIST BEING REQUESTED");
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
							else { return saveSongs(tracks, newParty.id, res.party, tracks.length - 1); }
						});
					}else {
						sockt.emit('part-name-taken');
					}					
				});
			}else {
				console.log(err);
			}
		});		
	},

	guestJoin: function(res) {
		console.log("GUEST ATTEMPTING TO JOIN");
		socket.join(res.party);
		PartyModel.findOne({ 'name': res.party }, function(err, results) {
			if(!results) {
				io.to(res.party).emit('party-not-found');
				return;
			}
			var queue = results.queue;
			return dealGuestQueue(queue, res.party, results.id, queue.length - 1);
		});
	},

	udpateQueue: function(res) {
		//res.party, res.URI
		console.log('SONG UPVOTED');
		PartyModel.findOne({ 'name': res.party }, function(err, party_results) {
			SongModel.findOne({ 'URI': res.URI, 'party': party_results.id }, function(err, song_results) {
				song_results.upvotes++;
				song_results.save();
				io.to(res.party).emit('client-update', song_results.URI);
				return;
			});
		});
	},

	endSong: function(res) {
		console.log('SONG ENDED');
		PartyModel.findOne({ 'name': res.party }, function(err, party_results) {
			SongModel.findOne({ 'URI': res.URI, 'party': party_results.id }, function(err, song_results) {
				song_results.upvotes = -1;
				song_results.save();
				io.to(res.party).emit('song-over', song_results.URI);
				return;
			});
		});
	},

	linkSocket: function(_io, _socket) {
		socket = _socket;
		io = _io;
	}

}

/*
 *HELPER FUNCTIONS
 */
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


/*
 *The two functions below use recursion to 
 *handle the asynchronous saving of documents to a mongoDB
 */
var host_queue = [];
var saveSongs = function(tracks, party_id, party_name, index) {
	if(index == -1) {
		console.log('ready to emit inital queue');
		io.to(party_name).emit('init-queue', host_queue);
		return;
	}else if(index == tracks.length - 1) {
		host_queue = [];
	}
	var newSong = new SongModel({
		party: party_id,
		name: tracks[index].title,
		artist: tracks[index].artist,
		URI: tracks[index].URI,
		art: tracks[index].art,
	});
	host_queue.push({
		name: tracks[index].title,
		artist: tracks[index].artist,
		URI: tracks[index].URI,
		art: tracks[index].art,			
	});
	newSong.save(function(err) {
		if(err) {
			console.log(err);
		}else{
			saveSongs(tracks, party_id, party_name, index - 1);	
		}
	});
};

var guest_queue = [];
var dealGuestQueue = function(queue, party_name, obj_id, index) {
	if(index == -1) {
		console.log("ready to emit queue to guest joining");
		io.to(party_name).emit('init-guest', guest_queue);
		return;
	}else if(index == queue.length - 1) {
		guest_queue = [];
	}
	SongModel.findOne({ 'URI': queue[index], 'party': obj_id }, function(err, results) {
		if(err) { return console.log('ERROR FINDING SONGS: ' + err)}
		guest_queue.push({
			name: results.name,
			artist: results.artist,
			URI: results.URI,
			art:results.art,
			upvotes: results.upvotes
		});
		dealGuestQueue(queue, party_name, obj_id, index - 1);
	});	
}












