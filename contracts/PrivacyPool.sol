// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MerkleTreeWithHistory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[6] memory input
    ) external view returns (bool r);
}

/**
 * @title PrivacyPool
 * @dev A reusable privacy pool for a fixed denomination
 * Allows deposits of a specific ETH amount and ZK-proof-based withdrawals
 */
contract PrivacyPool is MerkleTreeWithHistory {
    IVerifier public verifier;
    IERC20 public token;
    uint256 public denomination;
    
    mapping(uint256 => bool) public nullifierHashes;
    
    bool private _locked;

    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    event PoolDeposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
    event PoolWithdrawal(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee);

    /**
     * @dev Constructor
     * @param _verifier Address of the ZK verifier contract
     * @param _hasher Address of the Poseidon hasher contract
     * @param _denomination The fixed denomination for this pool (in wei)
     * @param _token Address of the zkNull token
     */
    constructor(
        address _verifier,
        address _hasher,
        uint256 _denomination,
        address _token
    ) MerkleTreeWithHistory(_hasher) {
        require(_denomination > 0, "Denomination must be greater than 0");
        verifier = IVerifier(_verifier);
        denomination = _denomination;
        token = IERC20(_token);
    }

    /**
     * @dev Deposit tokens into the pool
     * @param _commitment The commitment hash (Poseidon(secret, nullifier))
     */
    function deposit(uint256 _commitment) external nonReentrant {
        require(token.transferFrom(msg.sender, address(this), denomination), "Transfer failed");
        uint32 insertedIndex = _insert(_commitment);
        emit PoolDeposit(bytes32(_commitment), insertedIndex, block.timestamp);
    }

    /**
     * @dev Withdraw tokens from the pool using a ZK proof
     * @param _proof_a ZK proof component a
     * @param _proof_b ZK proof component b
     * @param _proof_c ZK proof component c
     * @param _root Merkle root
     * @param _nullifierHash Nullifier hash to prevent double-spending
     * @param _recipient Address to receive the funds
     * @param _relayer Address of the relayer (optional)
     * @param _fee Fee for the relayer (optional)
     * @param _refund Refund amount (optional, for gas compensation)
     */
    function withdraw(
        uint[2] memory _proof_a,
        uint[2][2] memory _proof_b,
        uint[2] memory _proof_c,
        uint256 _root,
        uint256 _nullifierHash,
        address _recipient,
        address _relayer,
        uint256 _fee,
        uint256 _refund
    ) external nonReentrant {
        require(_fee <= denomination, "Fee exceeds transfer value");
        require(!nullifierHashes[_nullifierHash], "The note has been already spent");
        require(isKnownRoot(_root), "Cannot find your merkle root");
        
        require(
            verifier.verifyProof(
                _proof_a,
                _proof_b,
                _proof_c,
                [
                    _root,
                    _nullifierHash,
                    uint256(uint160(_recipient)),
                    uint256(uint160(_relayer)),
                    _fee,
                    _refund
                ]
            ),
            "Invalid withdraw proof"
        );

        nullifierHashes[_nullifierHash] = true;

        require(token.transfer(_recipient, denomination - _fee), "Payment to recipient failed");
        
        if (_fee > 0) {
            require(token.transfer(_relayer, _fee), "Payment to relayer failed");
        }
        
        emit PoolWithdrawal(_recipient, bytes32(_nullifierHash), _relayer, _fee);
    }

    /**
     * @dev Get the contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
