// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHasher {
    function poseidon(uint256[2] memory inputs) external pure returns (uint256);
}

contract MerkleTreeWithHistory {
    uint256 public constant LEVELS = 20;
    uint256 public constant ROOT_HISTORY_SIZE = 30;

    uint256[LEVELS] public filledSubtrees;
    uint256[LEVELS] public zeros;
    uint256 public currentRootIndex;
    uint256 public nextIndex;

    mapping(uint256 => bool) public roots;
    uint256[ROOT_HISTORY_SIZE] public rootHistory;

    IHasher public hasher;

    event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
    event Withdrawal(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee);

    constructor(address _hasher) {
        hasher = IHasher(_hasher);
        
        uint256 currentZero = 0; // Starting zero value (can be a nothing-up-my-sleeve number)
        // Actually, Tornado uses a specific string hashed, but 0 is fine for a clone.
        // But wait, Poseidon(0,0) is not 0.
        // We need to calculate the zero hashes for each level.
        
        for (uint32 i = 0; i < LEVELS; i++) {
            zeros[i] = currentZero;
            filledSubtrees[i] = currentZero;
            currentZero = hasher.poseidon([currentZero, currentZero]);
        }

        roots[currentZero] = true;
        rootHistory[0] = currentZero;
    }

    function _insert(uint256 _leaf) internal returns (uint32 index) {
        uint32 currentIndex = uint32(nextIndex);
        require(currentIndex < uint32(2)**LEVELS, "Merkle tree is full");

        uint256 currentLevelHash = _leaf;
        uint256 left;
        uint256 right;

        for (uint32 i = 0; i < LEVELS; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros[i];
                filledSubtrees[i] = currentLevelHash;
            } else {
                left = filledSubtrees[i];
                right = currentLevelHash;
            }
            currentLevelHash = hasher.poseidon([left, right]);
            currentIndex /= 2;
        }

        uint256 newRoot = currentLevelHash;
        uint256 newRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        currentRootIndex = newRootIndex;
        rootHistory[newRootIndex] = newRoot;
        roots[newRoot] = true;
        nextIndex += 1;
        
        return uint32(nextIndex - 1);
    }

    function isKnownRoot(uint256 _root) public view returns (bool) {
        return roots[_root];
    }
    
    function getLastRoot() public view returns (uint256) {
        return rootHistory[currentRootIndex];
    }
}
