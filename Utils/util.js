module.exports = {
	stampTime: function() {
		var date = new Date();
		return {
			hour: date.getUTCHours(),
			day: date.getUTCDate(),
			month: date.getUTCMonth(),
			year: date.getUTCFullYear()
		}
	}
}