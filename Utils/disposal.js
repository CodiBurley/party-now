var Util = require('./util'),
    Constant = require('./constant');
var PartyModel = require('../models/Party').Party,
	SongModel = require('../models/Party').Song; 

module.exports = function(party_name, callback) {
	if(party_name) {
		var params = { 'name': party_name };
		PartyModel.findOne(params, function(err, results) {
			console.log('RESULTS: ' + results);
			if(err) { 
				console.log('ERR');
				return callback(false);
			}else if(results && partyExpired(results.timestamp)) {
				console.log('RESULTS + EXPIRE');
				disposeSongs(results.timestamp);
				return callback(false);
			}else if(!results) {
				console.log('NO RESULTS');
				return callback(false);
			}else {
				console.log('ELSE');
				return callback(true);
			}
		});
	} else {
		PartyModel.find(params, function(err, results) {
			if(err) { return console.log(err); }
			for(var i = 0; i < results.length; i++) {
				if( partyExpired(results[i].timestamp) ) { 
					disposeSongs(results[i].id); 
					results[i].remove();
				};
			}
		});
	}
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

var disposeSongs = function(party_id) {
	SongModel.find({ 'party': party_id }, function(err, results) {
		if(err) { return console.log(err); }
		for(var i = 0; i < results.length; i++) {
			results[i].remove();
		}
	})
}