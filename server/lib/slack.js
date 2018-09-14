const {WebClient, RTMClient} = require('@slack/client');
const config = require('config');
const Configstore = require('configstore');
const pkg = require('../package.json');
const conf = new Configstore(pkg.name);

module.exports = function(tetManager, logger) {
  let channels = {};
  let rtmClient;

  Object.keys(conf.all).forEach((teamID)=>{
    const {accessToken, userID, botAccessToken, botUserID} = conf.get(teamID);
    init(teamID, accessToken, userID, botAccessToken, botUserID);
  });

  async function init(teamID, accessToken, userID, botAccessToken, botUserID) {
    const userClient = new WebClient(accessToken);
    const botClient = new WebClient(botAccessToken);
    if (rtmClient != null) {
      await rtmClient.disconnect();
    }
    rtmClient = new RTMClient(botAccessToken);
    rtmClient.start();

    let cursor;
    let _channels = [];
    while (cursor != '') {
      const result = await botClient.conversations.list({types: 'public_channel,private_channel', limit: 200, cursor});
      _channels = _channels.concat(result.channels.filter((ch)=>ch.is_member && !ch.is_general));
      cursor = result.response_metadata.next_cursor;
    }
    channels = _channels;

    rtmClient.on('member_joined_channel', async ({user, channel, inviter})=>{
      if (user==botUserID) {
        await tetManager.addChannel(teamID, channel, '0');
      } else {
        try {
          if (!await tetManager.userExists(teamID, userID)) {
            throw new Error('user not found');
          }
          await tetManager.join(teamID, channel, userID);
        } catch (err) {
          logger.error(err);
          try {
            await userClient.conversations.kick({channel, user});
          } catch (err) {
            logger.error(err);
          }
        }
      }
    });
    rtmClient.on('member_left_channel', async ({user, channel})=>{
      if (user==botUserID) {
        try {
          await tetManager.deleteChannel(teamID, channel);
        } catch (err) {
          logger.error(err);
        }
      } else {
        // FIX: member_joined_channelでkickされたときもこれが発行され、ユーザーがいないのにleaveしようとする(evmでrejectされるから問題ないが…)
        try {
          await tetManager.leave(teamID, channel, userID);
        } catch (err) {
          logger.error(err);
        }
      }
    });
  }

  return {
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
};
