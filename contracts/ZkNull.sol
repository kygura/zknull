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

contract ZkNull is MerkleTreeWithHistory {
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

    constructor(
        address _verifier,
        address _hasher,
        uint256 _denomination,
        address _token
    ) MerkleTreeWithHistory(_hasher) {
        verifier = IVerifier(_verifier);
        denomination = _denomination;
        token = IERC20(_token);
    }

    function deposit(uint256 _commitment) external nonReentrant {
        require(token.transferFrom(msg.sender, address(this), denomination), "Transfer failed");
        uint32 insertedIndex = _insert(_commitment);
        emit Deposit(bytes32(_commitment), insertedIndex, block.timestamp);
    }

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
        
        emit Withdrawal(_recipient, bytes32(_nullifierHash), _relayer, _fee);
    }
}
