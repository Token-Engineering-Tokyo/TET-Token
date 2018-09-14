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
    mapping(string=>User) _users;
    mapping(address=>string) _userLookup;

    constructor() {
        tokenAddress = new TETToken();
    }

    function users(string userID) public view returns(bool managed, uint managedBalance, address owner) {
        require(_users[userID].exists);
        return (_users[userID].managed, _users[userID].managedBalance, _users[userID].owner);
    }

    function userExists(string userID) public view returns(bool exists) {
        return (_users[userID].exists);
    }

    function addChannel(string channelID, uint initialActivity) public onlyRole(SLACK_BRIDGE) {
        require(bytes(channelID).length != 0);
    }

    function deleteChannel(string channelID) public onlyRole(SLACK_BRIDGE) {
    }

    function addUser(string userID, uint value) public onlyRole(SLACK_BRIDGE) {
        require(bytes(userID).length != 0);
        _users[userID] = User(true, true, value, address(0));
        TETToken(tokenAddress).mint(this, value);
    }

    function join(string channelID, string userID) public onlyRole(SLACK_BRIDGE) {
        require(_users[userID].exists);
    }

    function leave(string channelID, string userID) public onlyRole(SLACK_BRIDGE) {
        require(_users[userID].exists);
    }

    function associateOwner(string userID, address owner) public onlyRole(SLACK_BRIDGE) {
        require(owner!=address(this));
        require(_users[userID].exists);
        require(bytes(_userLookup[owner]).length == 0);

        if (_users[userID].managed) {
            TETToken(tokenAddress).transferFrom(this, owner, _users[userID].managedBalance);
            _users[userID].managed = false;
            _users[userID].managedBalance = 0;
        } else {
            TETToken(tokenAddress).transferFrom(_users[userID].owner, owner, TETToken(tokenAddress).balanceOf(_users[userID].owner));
        }
        _users[userID].owner = owner;
    }

    function balanceOf(string userID) public view returns(uint balance) {
        if (_users[userID].managed) {
            return _users[userID].managedBalance;
        } else {
            return TETToken(tokenAddress).balanceOf(_users[userID].owner);
        }
    }

    function transferFrom(string fromUserID, string toUserID, uint value) public onlyRole(SLACK_BRIDGE) {
        address from;
        address to;
        if (_users[fromUserID].managed) {
            from = this;
            _users[fromUserID].managedBalance.sub(value);
        } else {
            from = _users[fromUserID].owner;
        }

        if (_users[toUserID].managed) {
            to = this;
            _users[fromUserID].managedBalance.add(value);
        } else {
            to = _users[toUserID].owner;
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
