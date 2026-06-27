// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BlitzPass
/// @notice On-chain "live event experience": attendees claim a pass and leave
///         reactions. All activity is real on-chain transactions so a big screen
///         can show a live feed, leaderboard, attendee count and total tx volume.
/// @dev    A trusted relayer submits txs on behalf of users (paying gas), passing
///         the user's burner address as `user`. This keeps audience onboarding
///         gasless and frictionless. Acceptable trust model for a live event demo.
contract BlitzPass {
    // --- per-event state ---
    mapping(uint256 => uint256) public attendeeCount;                  // eventId => unique attendees
    mapping(uint256 => mapping(address => bool)) public attended;      // eventId => user => checked-in
    mapping(uint256 => mapping(address => uint256)) public score;      // eventId => user => reaction count
    mapping(uint256 => mapping(uint8 => uint256)) public reactionTally;// eventId => kind => count

    // --- global state ---
    uint256 public totalTx; // every claim/react bumps this; powers the "on-chain tx" counter

    event Claimed(
        uint256 indexed eventId,
        address indexed user,
        uint256 attendeeNumber,
        uint256 timestamp
    );

    event Reacted(
        uint256 indexed eventId,
        address indexed user,
        uint8 indexed kind,
        uint256 newScore,
        uint256 timestamp
    );

    /// @notice Claim a BlitzPass (check in). Idempotent: a repeat claim never
    ///         reverts (so a double-tap can't break the live demo) but only the
    ///         first claim counts toward attendance and emits Claimed.
    function claimPass(uint256 eventId, address user) external {
        unchecked {
            totalTx++;
        }
        _ensureAttendance(eventId, user);
    }

    /// @notice Leave a reaction. Auto-checks-in if the user hasn't claimed yet,
    ///         so reactions never revert during a fast-moving live demo.
    function react(uint256 eventId, uint8 kind, address user) external {
        unchecked {
            totalTx++;
        }
        _ensureAttendance(eventId, user);

        uint256 s = ++score[eventId][user];
        unchecked {
            reactionTally[eventId][kind]++;
        }
        emit Reacted(eventId, user, kind, s, block.timestamp);
    }

    /// @dev Marks attendance on first sight and emits Claimed once.
    function _ensureAttendance(uint256 eventId, address user) private {
        if (!attended[eventId][user]) {
            attended[eventId][user] = true;
            uint256 n = ++attendeeCount[eventId];
            emit Claimed(eventId, user, n, block.timestamp);
        }
    }

    // --- views (handy for the stage screen / sanity checks) ---

    function isAttendee(uint256 eventId, address user) external view returns (bool) {
        return attended[eventId][user];
    }

    function getScore(uint256 eventId, address user) external view returns (uint256) {
        return score[eventId][user];
    }
}
