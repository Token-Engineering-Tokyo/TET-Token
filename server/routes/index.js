const express = require('express');
const router = express();
const axios = require('axios');
const config = require('config');
const querystring = require('querystring');
const lib = require('../lib');

function authed(req, res, next) {
  if (lib.slack.isAuthed()) {
    next();
  } else {
    res.redirect('/auth');
  }
}

function loggedin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/', authed, loggedin, (req, res)=>{
  res.render('index');
});

router.get('/login', authed, (req, res)=>{
  res.redirect(`https://slack.com/oauth/authorize?scope=identity.basic&client_id=${config.slack.client_id}`);
});

router.get('/auth', (req, res) =>{
  res.redirect(`https://slack.com/oauth/authorize?scope=bot,admin,channels:write,channels:read,groups:read,groups:write&client_id=${config.slack.client_id}`);
});

router.get('/callback', async (req, res, next) =>{
  try {
    const {data} = await axios.post('https://slack.com/api/oauth.access', querystring.stringify({
      client_id: config.slack.client_id,
      client_secret: config.slack.client_secret,
      code: req.query.code,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (data.user) {
      // user login callack
      if (data.ok) {
        req.session.user = data.user;
        res.redirect('/');
      } else {
        lib.log.logger.warn('faild to login', data);
        res.redirect('/login');
      }
    } else {
      // admin auth callback
      if (data.ok && Object.keys(config.contracts).indexOf(data.team_id) !== -1) {
        lib.slack.setToken(data.team_id, data.access_token, data.user_id, data.bot.bot_access_token, data.bot.bot_user_id);
        res.redirect(`/`);
      } else {
        lib.log.logger.warn('faild to auth', data);
        res.redirect('/auth');
      }
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
