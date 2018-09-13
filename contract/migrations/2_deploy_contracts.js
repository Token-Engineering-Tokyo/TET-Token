/* global artifacts */

const TETManager = artifacts.require('./TETManager.sol');

module.exports = function(deployer) {
  deployer.deploy(TETManager);
};
