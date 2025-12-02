// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockHasher {
    function poseidon(uint256[2] memory inputs) external pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(inputs[0], inputs[1]))) % 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    }
}
