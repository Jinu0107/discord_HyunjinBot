const axios = require('axios');
const API_KEY = require('./config.json').api_key;
const log = console.log;

async function getSummonerData(summoner_name) {
    let data = null;
    try {
        data = await axios.get(`https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURI(summoner_name)}?api_key=${API_KEY}`);
    } catch (error) {
        log("에러발생 : " + error);
    }
    // log(data);
    return data;
}

async function getLeagueData(summoner_id) {
    let data = null;
    try {
        data = await axios.get(`https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner_id}?api_key=${API_KEY}`);
    } catch (error) {
        log("에러발생 : " + error);
    }
    return data;
}



module.exports = {
    getSummonerData: getSummonerData,
    getLeagueData: getLeagueData
}