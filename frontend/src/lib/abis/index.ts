export const PrivacyRouterABI = [
  "function depositVariable(uint256[] calldata _commitments, uint256[] calldata _denominations) external payable",
  "function getPool(uint256 _denomination) external view returns (address)",
  "event VariableDeposit(address indexed sender, uint256 totalAmount, uint256 fragments)"
];

export const PrivacyPoolABI = [
  "function deposit(uint256 _commitment) external payable",
  "function withdraw(uint256[2] memory _proof_a, uint256[2][2] memory _proof_b, uint256[2] memory _proof_c, uint256 _root, uint256 _nullifierHash, address _recipient, address _relayer, uint256 _fee, uint256 _refund) external payable",
  "function isKnownRoot(uint256 _root) public view returns (bool)",
  "function denomination() external view returns (uint256)",
  "event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)"
];
