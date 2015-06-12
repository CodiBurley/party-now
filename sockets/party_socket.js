/*
 * TODO, change io.to.emit to socket.emit for
 * instances where only you only want event emitted to 
 * one socket.
 */

var request = require('request');
var mongoose = require('mongoose'),
	PartyModel = require('../models/Party').Party,
	SongModel = require('../models/Party').Song;
var Util = require('../Utils/util'),
	Disposal = require('../Utils/disposal');


var io = null,
	socket = null;

module.exports = {

	hostParty: function(res) {
		console.log('PLAYLIST BEING REQUESTED');
		var user_id = res.user_id,
			auth_key = res.token;
		// Dispose of any party with the name requested if the party is expired,
		// status of name is given in callback variable.
		Disposal(res.party, function(name_taken) {
			if(name_taken) { 
				console.log('NAME TAKEN');
				return socket.emit('party-name-taken'); 
			}
			// Set up a GET request for the songs of playlist provied
			var options = {
				url: 'https://api.spotify.com/v1/users/'+ user_id +'/playlists/' + res.list_id + '/tracks' ,
				method: 'GET',
				headers: { 'Authorization': 'Bearer ' + auth_key }
			};	
			// This requests the songs in a playlist for a playlist with
			// playlist id: list_id from a user with user id: user_id,
			// user must be authenticated with authentication key: auth_key	
			request(options, function(err, resp, body) {
				if(!err) {
					body = JSON.parse(body);
					var tracks = parseTracks(body.items), // tracks and uriArray are arrays,
					    uriArray = getURIs(tracks);       // see parseTracks() and getURIs()
					socket.join(res.party);
					// After joing the socket that the rest of the party is
					// on, a new Party is created with a queue full of songs (URIs)
					// from the selected playlist, and timestamped with the current time
					var newParty = new PartyModel({
						name: res.party,
						queue: uriArray,
						timestamp: Util.stampTime()
					});
					newParty.save(function(err) {
						if(err) { return console.log(err); }
						// After party is created, save all songs from tracks with
						// references to the party, and emit queue of songs to host
						else { return saveSongs(tracks, newParty.id, res.party, tracks.length - 1); }
					});
				}else { console.log(err); }
			});
		});
	},

	guestJoin: function(res) {
		console.log("GUEST ATTEMPTING TO JOIN");
		PartyModel.findOne({ 'name': res.party }, function(err, results) {
			if(!results) {
				socket.emit('party-not-found');
				return;
			}
			// If the party the guest is trying to join exists, join that
			// party and emit party queue to guest in dealGuestQueue
			socket.join(res.party)
			var queue = results.queue;
			return dealGuestQueue(queue, res.party, results.id, queue.length - 1);
		});
	},

	/*
	 * Function is called whenever a song is upvoted of downvoted
	 * For upvote: votevalue = 1, for downvote: votevalue = -1
	 */
	udpateQueue: function(res) {
		console.log('SONG UPVOTED');
		PartyModel.findOne({ 'name': res.party }, function(err, party_results) {
			Util.updateTime(party_results); // Timestamp is update when activity occurs on party
			SongModel.findOne({ 'URI': res.URI, 'party': party_results.id }, function(err, song_results) {
				song_results.upvotes += res.votevalue;
				song_results.save();
				// After updating the queue in the database, emit to let all the other guests know
				io.to(res.party).emit('client-update', { URI: song_results.URI, votevalue: res.votevalue });
				return;
			});
		});
	},

	/* 
	 * Function is called whenever a song that was at the top of a queue
	 * is done playing
	 */
	endSong: function(res) {
		console.log('SONG ENDED');
		PartyModel.findOne({ 'name': res.party }, function(err, party_results) {
			SongModel.findOne({ 'URI': res.URI, 'party': party_results.id }, function(err, song_results) {
				song_results.upvotes = 0;
				song_results.save();
				// After song is updated in database, emit to let all other guests know
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

// HELPER FUNCTIONS 

/*
 * Function that returns an array of objects containing: 
 * { title, artist, art, URI } for each song in tracks
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

/*
 * Function that returns an array of strings containing
 * the SOULS OF CHILDREN, just kidding, its the URI's
 * each song in tracks
 */
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
		socket.emit('init-queue', host_queue);
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
		socket.emit('init-guest', guest_queue);
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
