var Util = require('./util'),
    Constant = require('./constant');
var PartyModel = require('../models/Party').Party,
	SongModel = require('../models/Party').Song; 

module.exports = function(party_name) {
	var params = party_name ? { 'name': party_name } : {};
	PartyModel.find(params, function(err, results) {
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
	return true;
}