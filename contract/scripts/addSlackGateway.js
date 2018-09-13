/* global artifacts */

const TETManager = artifacts.require('./TETManager.sol');

module.exports = function(callback) {
  if (process.argv[4] == null || !/^0x[a-fA-F0-9]{40}$/.test(process.argv[4])) {
    throw new Error('invalid argments');
  }
  (async ()=>{
    const tetManager = await TETManager.deployed();
    await tetManager.addSlackBridgeAddress(process.argv[4]);
    callback();
  })().catch(console.error);
};
