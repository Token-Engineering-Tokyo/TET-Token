const buildTETManager = require('../../contract/build/contracts/TETManager.json');

module.exports = {
  secret: 'secret',
  slack: {
    client_id: process.env.SLACK_CLIENT_ID,
    client_secret: process.env.SLACK_CLIENT_SECRET,
  },
  web3: {
    provider: 'http://localhost:8545',
    accountIndex: 0,
  },
  abi: {
    TETManager: buildTETManager.abi,
  },
  contracts: {
    T4DQ27W74: buildTETManager.networks['1'].address,
  },
  gasLimit: {
    addChannel: 1000000,
    addUser: 1000000,
    join: 1000000,
  },
};
