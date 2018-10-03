const {WebClient, RTMClient} = require('@slack/client');
const config = require('config');
const Configstore = require('configstore');
const pkg = require('../package.json');
const conf = new Configstore(pkg.name);

module.exports = function(tetManager, logger) {
  let channels = [];
  let users = [];
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

    cursor = null;
    let _users = [];
    while (cursor != '') {
      const result = await botClient.users.list({limit: 200, cursor});
      _users = _users.concat(result.members.filter((user)=>!(user.is_bot || user.id == 'USLACKBOT')));
      cursor = result.response_metadata.next_cursor;
    }
    users = _users;

    await Promise.all(channels.map(async (channel)=>{
      if (!await tetManager.channelExists(teamID, channel.id)) {
        await tetManager.addChannel(teamID, channel.id);
      }
    }));

    await Promise.all(users.map(async (user)=>{
      if (!await tetManager.userExists(teamID, user.id)) {
        await tetManager.addUser(teamID, user.id);
      }
    }));

    rtmClient.on('channel_joined', async ({channel: {id: channel}})=>{
      logger.info(`channel_joined, teamID: ${teamID}, channel: ${channel}`);
      await tetManager.addChannel(teamID, channel, '0');
    });
    rtmClient.on('channel_left', async ({channel})=>{
      logger.info(`channel_left, teamID: ${teamID}, channel: ${channel}`);
      try {
        await tetManager.deleteChannel(teamID, channel);
      } catch (err) {
        logger.error(err);
      }
    });
    rtmClient.on('group_joined', async ({channel: {id: channel}})=>{
      logger.info(`group_joined, teamID: ${teamID}, channel: ${channel}`);
      await tetManager.addChannel(teamID, channel, '0');
    });
    rtmClient.on('group_left', async ({channel})=>{
      logger.info(`group_left, teamID: ${teamID}, channel: ${channel}`);
      try {
        await tetManager.deleteChannel(teamID, channel);
      } catch (err) {
        logger.error(err);
      }
    });

    rtmClient.on('member_joined_channel', async ({user, channel, inviter})=>{
      // A user joined a public or private channel
      if (user!=botUserID) {
        logger.info(`member_joined_channel, teamID: ${teamID}, channel: ${channel}, user: ${user}`);
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
      // A user left a public or private channel
      if (user!=botUserID) {
        logger.info(`member_left_channel, teamID: ${teamID}, channel: ${channel}, user: ${user}`);
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
