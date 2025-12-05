// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZkNullToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10000000 * 10 ** 18;

    constructor() ERC20("zkNull Token", "ZKN") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        require(amount <= 10000 * 10 ** decimals(), 
        "Max mint amount per tx exceeded");
        _mint(to, amount);
    }
}
