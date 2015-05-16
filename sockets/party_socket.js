var request = require('request');
var mongoose = require('mongoose'),
	PartyModel = require('../models/Party').Party;

var io = null,
	socket = null;

module.exports = {

	joinParty: function(res) {
		var party_query = PartyModel.findOne({ 'name' : res.party }, function(err, results) {
			socket.join(res.party); //the room must be joined regardless
			if(!results) {                      //if a party with the name given is not found,
				var newParty = new PartyModel({ //then make a party with that name
					name: res.party
				});
				newParty.save(function(err) {
					if(err) { return console.log(err); }
				});
			}else {
				return io.to(results.name).emit('queueReturn', {
					//return something to the socket that joined!
				})
			}
		})
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