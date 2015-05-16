module.exports = (function() {

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

	var partySchema = new Schema({
		name: String,
		queue: Array,    //An Array of URI's that refer to Songs
		playlist: Array  //same as above
	});

	var songSchema = new Schema({
		party: { type: Schema.Types.ObjectId, ref: 'Party' },
		name: String,
		artist: String,
		URI: Number,
		art: String,
		upvotes: { type: Number, required: true }
	});

	return {
		Party: mongoose.model('Party', partySchema),
		Song: mongoose.model('Song', songSchema)
	};

})();