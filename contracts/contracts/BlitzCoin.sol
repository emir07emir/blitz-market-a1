// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/// @title BlitzCoin
/// @notice Shared multi-token economy for BlitzPass and BlitzMarket.
///         Includes BLITZ (coinId 0) and event-specific coins (coinId > 0).
contract BlitzCoin is ERC1155 {
    // Tracks if a user has already been rewarded for a specific event
    mapping(uint256 => mapping(address => bool)) public hasBeenRewarded;
    
    // Tracks total supply per coinId
    mapping(uint256 => uint256) public totalSupply;

    event Rewarded(uint256 indexed eventId, address indexed user, uint256 amount, uint256 newBalance);
    event Swapped(address indexed user, uint256 indexed fromId, uint256 indexed toId, uint256 amount);
    event Purchased(uint256 indexed productId, address indexed user, uint256 indexed coinId, uint256 price, uint256 timestamp);

    constructor() ERC1155("https://api.blitzpass.demo/metadata/{id}.json") {}

    /// @notice Rewards a user with a pseudo-random amount (50-500) of event coins.
    ///         Callable by relayer on behalf of the user. Only once per event.
    function reward(uint256 eventId, address user) external returns (uint256) {
        require(!hasBeenRewarded[eventId][user], "Already rewarded for this event");
        
        hasBeenRewarded[eventId][user] = true;
        
        // Pseudo-random amount between 50 and 500
        uint256 amount = 50 + (uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, user, eventId))) % 451);
        
        _mint(user, eventId, amount, "");
        totalSupply[eventId] += amount;
        
        emit Rewarded(eventId, user, amount, balanceOf(user, eventId));
        return amount;
    }

    /// @notice Swaps one coin type to another 1:1.
    function swap(address user, uint256 fromId, uint256 toId, uint256 amount) external {
        require(balanceOf(user, fromId) >= amount, "Insufficient balance to swap");
        
        _burn(user, fromId, amount);
        totalSupply[fromId] -= amount;
        
        _mint(user, toId, amount, "");
        totalSupply[toId] += amount;
        
        emit Swapped(user, fromId, toId, amount);
    }

    /// @notice Buys a product by burning the required coin amount.
    function buy(uint256 productId, address user, uint256 coinId, uint256 price) external {
        require(balanceOf(user, coinId) >= price, "Insufficient balance to buy");
        
        _burn(user, coinId, price);
        totalSupply[coinId] -= price;
        
        emit Purchased(productId, user, coinId, price, block.timestamp);
    }

    /// @notice Wrapper for ERC1155 balanceOf, keeping argument order consistent with requirements.
    function balanceOf(uint256 coinId, address user) public view returns (uint256) {
        return super.balanceOf(user, coinId);
    }

    /// @notice Returns balances for multiple coin IDs for a single user.
    function balancesOf(address user, uint256[] calldata ids) external view returns (uint256[] memory) {
        uint256[] memory batchBalances = new uint256[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            batchBalances[i] = balanceOf(ids[i], user);
        }
        return batchBalances;
    }
}
