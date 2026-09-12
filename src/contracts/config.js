export const STAKING_ADDRESS = "0x96eeBb81b2c4afB24182F66F14f05e9E7d4aD686";
export const VAMP_ADDRESS = "0x80FEa8DAec59c5Fe7B5125A30DCD4d4819B4Ee5b";

export const STAKING_ABI = [
  "function register(address _referrer, bytes32 _secretHash) external",
  "function stake(uint256 _amount) external",
  "function withdrawStake(uint256 _stakeIndex) external",
  "function claimReferralRewards() external",
  "function recoverAccount(string calldata _secret, address _newAddress) external",
  "function getPendingReward(address _user, uint256 _stakeIndex) public view returns (uint256)",
  "function getUserStakeCount(address _user) external view returns (uint256)",
  "function users(address) public view returns (bool isRegistered, address referrer, bytes32 passwordHash, uint256 referralRewards, uint256 totalStaked)",
  "function userStakes(address, uint256) public view returns (uint256 amount, uint256 startTime, bool withdrawn)",
  "function token() public view returns (address)",
  "function STAKE_DURATION() public view returns (uint256)"
];

export const VAMP_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function decimals() public view returns (uint8)"
];
