module.exports = (function() {

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

	var partySchema = new Schema({  //When searching for song, use party
		name: String,               //object id and URI
		queue: { type: Array, default: [] }    //An Array of URI's that refer to Songs
	});

	var songSchema = new Schema({
		party: { type: Schema.Types.ObjectId, ref: 'Party' },
		name: String,
		artist: String,
		URI: Number,
		art: String,
		upvotes: { type: Number, default: 0 },
		playing: {type: Boolean, default: false}
	});

	return {
		Party: mongoose.model('Party', partySchema),
		Song: mongoose.model('Song', songSchema)
	};

})();