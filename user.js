const mongoose = require('mongoose');

const Account = new mongoose.Schema({
    userName: { type: String, unique: true, required: true },
    summonerName: String,
    level: Number,
    tier: String,
    tierNumber: Number,
    winRate: String,
    gameCount: Number,
    leaguePoints : String,
});


module.exports = mongoose.model('User', Account);
