const {WebClient, RTMClient} = require('@slack/client');
const config = require('config');
const Configstore = require('configstore');
const pkg = require('../package.json');
const conf = new Configstore(pkg.name);

Object.keys(conf.all).forEach((teamID)=>{
  const {accessToken, userID, botAccessToken, botUserID} = conf.get(teamID);
  init(teamID, accessToken, userID, botAccessToken, botUserID);
});

let channels = {};

async function init(teamID, accessToken, userID, botAccessToken, botUserID) {
  const userClient = new WebClient(accessToken);
  const botClient = new WebClient(botAccessToken);
  const rtmClient = new RTMClient(botAccessToken);
  rtmClient.start();

  let cursor;
  let _channels = [];
  while (cursor != '') {
    const result = await botClient.conversations.list({types: 'public_channel,private_channel', limit: 200, cursor});
    _channels = _channels.concat(result.channels.filter((ch)=>ch.is_member && !ch.is_general));
    cursor = result.response_metadata.next_cursor;
  }
  channels = _channels;

  rtmClient.on('member_joined_channel', ({user, channel, inviter})=>{
    if (user==botUserID) {
    } else {
      userClient.conversations.kick({channel, user});
    }
  });
  rtmClient.on('member_left_channel', ({user, channel})=>{
    if (user==botUserID) {
    } else {
    }
  });
}

module.exports = {
  setToken: function(teamID, accessToken, userID, botAccessToken, botUserID) {
    conf.set({[teamID]: {accessToken, userID, botAccessToken, botUserID}});
    init(teamID, accessToken, userID, botAccessToken, botUserID);
  },
  isAuthed: function() {
    return Object.keys(config.contracts).filter((teamID)=>{
      return conf.get(teamID) == null;
    }).length == 0;
  },
};
