pragma solidity ^0.4.24;

import "./ERC223/ERC223_mintable_token.sol";
import "./TETChannelToken.sol";

contract TETToken is ERC223MintableToken {
    string public name = "TETToken";
    string public symbol = "TET";
    uint public decimals = 2;

    constructor() {
        totalSupply = 0;
    }

    function transferFrom(address _from,address _to, uint _value, bytes _data) public onlyOwner {
        uint codeLength;

        assembly {
            codeLength := extcodesize(_to)
        }

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        if(codeLength>0) {
            ERC223ReceivingContract receiver = ERC223ReceivingContract(_to);
            receiver.tokenFallback(_from, _value, _data);
        }
        emit Transfer(_from, _to, _value, _data);
    }

    function transferFrom(address _from, address _to, uint _value) public onlyOwner {
        uint codeLength;
        bytes memory empty;

        assembly {
            codeLength := extcodesize(_to)
        }

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        if(codeLength>0) {
            ERC223ReceivingContract receiver = ERC223ReceivingContract(_to);
            receiver.tokenFallback(_from, _value, empty);
        }
        emit Transfer(_from, _to, _value, empty);
    }
}
