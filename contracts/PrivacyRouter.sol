// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPrivacyPool {
    function deposit(uint256 commitment) external payable;
    function denomination() external view returns (uint256);
}

/**
 * @title PrivacyRouter
 * @dev Orchestrator contract for variable-amount deposits
 * Routes deposits to appropriate fixed-denomination pools
 */
contract PrivacyRouter {
    address public owner;
    
    // Mapping of denomination => pool address
    mapping(uint256 => address) public pools;
    
    // Array to track registered denominations
    uint256[] public registeredDenominations;
    
    event VariableDeposit(
        address indexed sender,
        uint256 totalAmount,
        uint256 fragments
    );
    
    event PoolRegistered(uint256 indexed denomination, address poolAddress);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Register a pool for a specific denomination
     * @param _denomination The denomination value
     * @param _poolAddress The address of the PrivacyPool contract
     */
    function registerPool(uint256 _denomination, address _poolAddress) external onlyOwner {
        require(_denomination > 0, "Invalid denomination");
        require(_poolAddress != address(0), "Invalid pool address");
        require(pools[_denomination] == address(0), "Pool already registered");
        
        // Verify the pool contract matches the denomination
        require(
            IPrivacyPool(_poolAddress).denomination() == _denomination,
            "Pool denomination mismatch"
        );
        
        pools[_denomination] = _poolAddress;
        registeredDenominations.push(_denomination);
        
        emit PoolRegistered(_denomination, _poolAddress);
    }
    
    /**
     * @dev Deposit variable amount across multiple pools
     * @param _commitments Array of commitment hashes
     * @param _denominations Array of denominations corresponding to each commitment
     */
    function depositVariable(
        uint256[] calldata _commitments,
        uint256[] calldata _denominations
    ) external payable {
        require(_commitments.length > 0, "Empty deposit");
        require(
            _commitments.length == _denominations.length,
            "Array length mismatch"
        );
        
        // Calculate total required value
        uint256 totalRequired = 0;
        for (uint256 i = 0; i < _denominations.length; i++) {
            totalRequired += _denominations[i];
        }
        
        require(msg.value == totalRequired, "Incorrect ETH amount sent");
        
        // Route each deposit to the appropriate pool
        for (uint256 i = 0; i < _commitments.length; i++) {
            uint256 denomination = _denominations[i];
            address poolAddress = pools[denomination];
            
            require(poolAddress != address(0), "Pool not found for denomination");
            
            // Forward the deposit to the pool
            IPrivacyPool(poolAddress).deposit{value: denomination}(_commitments[i]);
        }
        
        emit VariableDeposit(msg.sender, msg.value, _commitments.length);
    }
    
    /**
     * @dev Get pool address for a denomination
     */
    function getPool(uint256 _denomination) external view returns (address) {
        return pools[_denomination];
    }
    
    /**
     * @dev Get all registered denominations
     */
    function getRegisteredDenominations() external view returns (uint256[] memory) {
        return registeredDenominations;
    }
    
    /**
     * @dev Get number of registered pools
     */
    function getPoolCount() external view returns (uint256) {
        return registeredDenominations.length;
    }
}
