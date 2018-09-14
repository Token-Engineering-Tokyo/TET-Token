const Web3 = require('web3');
const config = require('config');
const web3 = new Web3(config.web3.provider);

const contracts = Object.entries(config.contracts)
  .map(([teamID, address])=>[teamID, new web3.eth.Contract(config.abi.TETManager, address)])
  .reduce((obj, item)=>({...obj, [item[0]]: item[1]}), {});

let account;
const accountPromise = (async ()=>{
  const accounts = await web3.eth.getAccounts();
  account = accounts[config.web3.accountIndex];
})();

function getAccount() {
  if (account!=null) {
    return Promise.resolve(account);
  } else {
    return accountPromise.then(()=>account);
  }
}

module.exports = {
  addChannel: async function(teamID, channelID, initialActivity) {
    if (!contracts[teamID]) {
      throw new Error('invalid teamID');
    }
    const from = await getAccount();
    return await contracts[teamID].methods.addChannel(channelID, initialActivity).send({from, gas: config.gasLimit.addChannel});
  },
  deleteChannel: async function(teamID, channelID) {
    if (!contracts[teamID]) {
      throw new Error('invalid teamID');
    }
    const from = await getAccount();
    return await contracts[teamID].methods.deleteChannel(channelID).send({from, gas: config.gasLimit.addChannel});
  },
  addUser: async function(teamID, userID) {
    if (!contracts[teamID]) {
      throw new Error('invalid teamID');
    }
    const from = await getAccount();
    return await contracts[teamID].methods.addUser(userID, '100').send({from, gas: config.gasLimit.addUser});
  },
  join: async function(teamID, channelID, userID) {
    if (!contracts[teamID]) {
      throw new Error('invalid teamID');
    }
    const from = await getAccount();
    return await contracts[teamID].methods.join(channelID, userID).send({from, gas: config.gasLimit.join});
  },
  leave: async function(teamID, channelID, userID) {
    if (!contracts[teamID]) {
      throw new Error('invalid teamID');
    }
    const from = await getAccount();
    return await contracts[teamID].methods.leave(channelID, userID).send({from, gas: config.gasLimit.leave});
  },
  userExists: async function(teamID, userID) {
    if (!contracts[teamID]) {
      throw new Error('invalid teamID');
    }
    return await contracts[teamID].methods.userExists(userID).call();
  },
  balanceOf: async function(teamID, userID) {
    if (!contracts[teamID]) {
      throw new Error('invalid teamID');
    }
    return await contracts[teamID].methods.balanceOf(userID).call();
  },
};
