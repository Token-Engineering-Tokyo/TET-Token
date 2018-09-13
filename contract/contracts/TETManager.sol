pragma solidity ^0.4.24;

import "./TETChannelToken.sol";
import "./TETToken.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/access/rbac/RBAC.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract TETManager is Ownable, RBAC {
    using SafeMath for uint;
    string public SLACK_BRIDGE = "slackBridge";

    struct User {
        bool exists;
        bool managed;
        uint managedBalance;
        address owner;
    }
    address public tokenAddress;
    mapping(string=>User) users;
    mapping(address=>string) userLookup;

    constructor() {
        tokenAddress = new TETToken();
    }

    function addChannel(string channelID, uint initialActivity) public onlyRole(SLACK_BRIDGE) {
        require(bytes(channelID).length != 0);
    }

    function deleteChannel(string channelID) public onlyRole(SLACK_BRIDGE) {
    }

    function addUser(string userID, uint value) public onlyRole(SLACK_BRIDGE) {
        require(bytes(userID).length != 0);
        users[userID] = User(true, true, value, address(0));
        TETToken(tokenAddress).mint(this, value);
    }

    function join(string channelID, string userID) public onlyRole(SLACK_BRIDGE) {
        require(users[userID].exists);
    }

    function associateOwner(string userID, address owner) public onlyRole(SLACK_BRIDGE) {
        require(owner!=address(this));
        require(users[userID].exists);
        require(bytes(userLookup[owner]).length == 0);

        if (users[userID].managed) {
            TETToken(tokenAddress).transferFrom(this, owner, users[userID].managedBalance);
            users[userID].managed = false;
            users[userID].managedBalance = 0;
        } else {
            TETToken(tokenAddress).transferFrom(users[userID].owner, owner, TETToken(tokenAddress).balanceOf(users[userID].owner));
        }
        users[userID].owner = owner;
    }

    function transferFrom(string fromUserID, string toUserID, uint value) public onlyRole(SLACK_BRIDGE) {
        address from;
        address to;
        if (users[fromUserID].managed) {
            from = this;
            users[fromUserID].managedBalance.sub(value);
        } else {
            from = users[fromUserID].owner;
        }

        if (users[toUserID].managed) {
            to = this;
            users[fromUserID].managedBalance.add(value);
        } else {
            to = users[toUserID].owner;
        }

        if(from != to) {
            TETToken(tokenAddress).transferFrom(from, to, value);
        }
    }

    function addSlackBridgeAddress(address bridgeAddress) public onlyOwner {
        addRole(bridgeAddress, SLACK_BRIDGE);
    }

    function deleteSlackBridgeAddress(address bridgeAddress) public onlyOwner {
        removeRole(bridgeAddress, SLACK_BRIDGE);
    }
}
