const Discord = require('discord.js');
const clinet = new Discord.Client();
const config = require('./config.json');
const User = require('./user');
const log = console.log;
const mongoose = require('mongoose');
const riot = require('./riot');

const defaultData = { queueType: 'UNRANKED', tier: 'UNRANKED', leaguePoints: '', rank: '', wins: 0, losses: 0 };
const tierObj = { IRON: 100, BRONZE: 600, SILVER: 1100, GOLD: 1600, PLATINUM: 2100, DIAMOND: 2600, MASTER: 3100, GRANDMASTER: 3600, CHALLENGER: 4100 };
const rankObj = { I: 400, II: 300, III: 200, IV: 100 };


mongoose.connect(config.url);
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', function () {
    // 몽고디비 서버에 연결
    console.log("Connected to mongod server");
});


clinet.on("ready", () => {
    log(`${clinet.user.tag}`);
});


clinet.on("message", (msg) => {
    const MSG = msg.content;
    const CMD = MSG.split(" ")[0];
    const PARAMS = MSG.split(" ").filter((x, idx) => idx >= 1);

    switch (CMD) {
        case "!도움":
            showCommandList(msg);
            break;
        case "!랭크":
            showRanking(msg);
            break;
        case "!등록":
            if (PARAMS.length != 2) {
                msg.channel.send("-!등록 (본인이름) (소환사이름)    소환사이름은 띄어쓰기가 있으면 안됩니다.");
                return;
            }
            insertUserData(msg, PARAMS);
            break;
        case "!갱신":
            msg.reply("갱신중...");
            updateSummonerData(msg);
            break;
    }
});

async function updateSummonerData(msg) {
    try {
        let userList = await User.find();
        for (let i = 0; i < userList.length; i++) {
            let summonerData = await riot.getSummonerData(userList[i].summonerName);
            summonerData = summonerData == null ? null : summonerData.data;
            let leagueData = await riot.getLeagueData(summonerData.id);

            leagueData = leagueData == null ? defaultData : leagueData.data.filter(x => x.queueType == 'RANKED_SOLO_5x5');
            leagueData = leagueData.length == 0 ? defaultData : leagueData[0];

            let tierNumber = tierObj[leagueData.tier] + rankObj[leagueData.rank] + leagueData.leaguePoints;
            tierNumber = isNaN(tierNumber) ? 0 : tierNumber;
            let gameCount = leagueData.wins + leagueData.losses;
            let winRate = Math.ceil((leagueData.wins / gameCount * 100) * 100) / 100;
            winRate = isNaN(winRate) ? 0 : winRate;

            userList[i].level = summonerData.summonerLevel;
            userList[i].tier = leagueData.tier + " " + leagueData.rank;
            userList[i].tierNumber = tierNumber;
            userList[i].winRate = winRate + "%";
            userList[i].gameCount = gameCount;
            userList[i].leaguePoints = leagueData.leaguePoints;

            await userList[i].save();
        }
        msg.reply("갱신완료");
    } catch (error) {
        log("갱신중 오류 발생 : " + error);
        msg.reply("갱신중 오류발생");
    }


}

function showCommandList(msg) {
    const embed = new Discord.MessageEmbed()
        .setColor('GREEN')
        .setTitle('도움말')
        .addFields(
            { name: '\u200B', value: '\u200B' },
            { name: '!도움', value: '`사용가능 명령어를 알려줍니다.`', inline: true },
            { name: '!랭크', value: '`티어를 기준으로 내림차순하여 등록된 유저를 보여줍니다.`', inline: true },
            { name: '!등록', value: '`사용자의 정보를 등록합니다.`', inline: true },
            { name: '!갱신', value: '`등록된 사용자의 소환사정보를 갱신합니다.`', inline: true },
        )
    msg.channel.send(embed);
}

async function showRanking(msg) {
    try {
        let userList = await User.find().sort({ tierNumber: -1 });
        const embed = new Discord.MessageEmbed()
            .setColor('GREEN')
            .setTitle('양디랭킹 (LOL)');
        userList.forEach((user, idx) => {
            embed.addFields(
                {
                    name: `\u200B`,
                    value:
                        "` " + (idx + 1) + "등 `    " +
                        "` " + user.userName + " `    " +
                        "` " + user.summonerName + " `    " +
                        "` " + user.tier + " " + user.leaguePoints + "점 `      " +
                        "` " + user.winRate + " `    " +
                        "` " + user.gameCount + "판 `    " +
                        "       [자세히보기](https://www.op.gg/summoner/userName=" + user.summonerName + ") "
                },
            );
        });
        msg.channel.send(embed);
    } catch (error) {
        msg.reply("데이터불러오는중 오류 발생");
    }
}


async function insertUserData(msg, params) {

    let summonerData = await riot.getSummonerData(params[1]);
    summonerData = summonerData == null ? null : summonerData.data;

    if (summonerData == null) {
        msg.reply("존재하지 않는 소환사이름 입니다.");
        return;
    }
    let leagueData = await riot.getLeagueData(summonerData.id);

    leagueData = leagueData == null ? defaultData : leagueData.data.filter(x => x.queueType == 'RANKED_SOLO_5x5');
    leagueData = leagueData.length == 0 ? defaultData : leagueData[0];

    const user = new User();


    let tierNumber = tierObj[leagueData.tier] + rankObj[leagueData.rank] + leagueData.leaguePoints;
    tierNumber = isNaN(tierNumber) ? 0 : tierNumber;
    let gameCount = leagueData.wins + leagueData.losses;
    let winRate = Math.ceil((leagueData.wins / gameCount * 100) * 100) / 100;
    winRate = isNaN(winRate) ? 0 : winRate;


    log(leagueData);

    user.userName = params[0];
    user.summonerName = params[1];
    user.level = summonerData.summonerLevel;
    user.tier = leagueData.tier + " " + leagueData.rank;
    user.tierNumber = tierNumber;
    user.winRate = winRate + "%";
    user.gameCount = gameCount;
    user.leaguePoints = leagueData.leaguePoints;


    try {
        await user.save();
        msg.reply("성공적으로 등록되었습니다.");
    } catch (error) {
        msg.reply("중복되는 이름입니다.");
    }

}


clinet.login(config.token);
