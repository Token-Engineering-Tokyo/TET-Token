pragma solidity ^0.4.11;

import "./ERC223_token.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract ERC223MintableToken is ERC223Token, Ownable {
    event Mint(address indexed to, uint256 amount);
    uint public totalSupply;

    function mint(address _to, uint256 _amount) public onlyOwner {
        bytes memory empty;

        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount, empty);
    }
}
