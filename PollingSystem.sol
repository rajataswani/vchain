// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PollingSystem {
    struct Poll {
        string title;
        string[] options;
        mapping(uint => uint) votes; // Mapping of option index to vote count
        mapping(address => mapping(uint => bool)) userVotedOptions; // Tracks whether a user voted for a specific option
        mapping(address => uint) userVotes; // Tracks the total number of votes a user has cast in a poll
        address owner;
        uint maxVotesPerUser; // Max number of votes each user can cast in the poll
        uint voterCount; // Number of people who voted in the poll
        bool isClosed; // Indicates if the poll is closed
        bool exists; // Indicates if the poll exists
    }

    uint public pollCount;
    mapping(uint => Poll) public polls;

    event PollCreated(uint pollId, string title, string[] options, address owner, uint maxVotesPerUser);
    event VoteCasted(uint pollId, uint optionIndex, address voter);
    event PollClosed(uint pollId, address owner);

    constructor() {
        pollCount = 0;
    }

    // Create a new poll
    function createPoll(string memory title, string[] memory options, uint maxVotesPerUser) public {
        require(options.length > 1, "There must be at least two options");
        require(maxVotesPerUser > 0, "Max votes per user must be greater than zero");


        pollCount++;
        Poll storage poll = polls[pollCount];
        poll.title = title;
        poll.options = options;
        poll.owner = msg.sender;
        poll.maxVotesPerUser = maxVotesPerUser;
        poll.isClosed = false;
        poll.exists = true;

        emit PollCreated(pollCount, title, options, msg.sender, maxVotesPerUser);
    }

    // Cast a vote in a poll
    function castVote(uint pollId, uint optionIndex) public {
        require(polls[pollId].exists, "Poll does not exist");
        require(!polls[pollId].isClosed, "Poll is closed");
        require(optionIndex < polls[pollId].options.length, "Invalid option index");
        require(!polls[pollId].userVotedOptions[msg.sender][optionIndex], "You have already voted for this option");
        require(polls[pollId].userVotes[msg.sender] < polls[pollId].maxVotesPerUser, "You have reached your max votes");

        // Mark that the user voted for the option
        polls[pollId].userVotedOptions[msg.sender][optionIndex] = true;

        // Increment the vote count for the chosen option
        polls[pollId].votes[optionIndex]++;
        
        // Increment the user's total vote count in the poll
        polls[pollId].userVotes[msg.sender]++;
        
        // If this is the user's first vote in the poll, increment the voter count
        if (polls[pollId].userVotes[msg.sender] == 1) {
            polls[pollId].voterCount++;
        }

        emit VoteCasted(pollId, optionIndex, msg.sender);
    }

    // Close a poll
    function closePoll(uint pollId) public {
        require(polls[pollId].exists, "Poll does not exist");
        require(polls[pollId].owner == msg.sender, "Only the poll owner can close the poll");
        require(!polls[pollId].isClosed, "Poll is already closed");

        polls[pollId].isClosed = true;

        emit PollClosed(pollId, msg.sender);
    }

    // Get poll details
    function getPollDetails(uint pollId) public view returns (string memory title, string[] memory options, address owner, uint voterCount, uint maxVotesPerUser, bool isClosed) {
        require(polls[pollId].exists, "Poll does not exist");

        Poll storage poll = polls[pollId];
        return (poll.title, poll.options, poll.owner, poll.voterCount, poll.maxVotesPerUser, poll.isClosed);
    }

    // Get votes for a specific option in a poll
    function getVotes(uint pollId, uint optionIndex) public view returns (uint) {
        require(polls[pollId].exists, "Poll does not exist");
        require(optionIndex < polls[pollId].options.length, "Invalid option index");

        return polls[pollId].votes[optionIndex];
    }
}
