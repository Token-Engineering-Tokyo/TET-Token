pragma solidity ^0.4.24;

contract TETChannelToken {
    uint price;
    address public tokenAddress;

    constructor(address _tokenAddress) {

    }

    function setPrice(uint _price) public {

    }

    function tokenFallback(address from, uint value, bytes data) public {
        require(msg.sender==tokenAddress);
    }
}
