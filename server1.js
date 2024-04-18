const express = require('express');
const Web3 = require('web3');
const contractABI = require('./path/to/PollingSystemABI.json'); // Load ABI from file
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const app = express();

// Set up web3 provider
const web3 = new Web3('YOUR_WEB3_PROVIDER_URL');

// Initialize contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Endpoint to create a new poll
app.post('/createPoll', async (req, res) => {
    const { title, options, maxVotesPerUser } = req.body;
    try {
        const accounts = await web3.eth.getAccounts();
        const result = await contract.methods.createPoll(title, options, maxVotesPerUser).send({ from: accounts[0] });
        res.json({ transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to cast a vote in a poll
app.post('/castVote', async (req, res) => {
    const { pollId, optionIndex } = req.body;
    try {
        const accounts = await web3.eth.getAccounts();
        const result = await contract.methods.castVote(pollId, optionIndex).send({ from: accounts[0] });
        res.json({ transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to close a poll
app.post('/closePoll', async (req, res) => {
    const { pollId } = req.body;
    try {
        const accounts = await web3.eth.getAccounts();
        const result = await contract.methods.closePoll(pollId).send({ from: accounts[0] });
        res.json({ transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get poll details
app.get('/pollDetails/:pollId', async (req, res) => {
    const { pollId } = req.params;
    try {
        const details = await contract.methods.getPollDetails(pollId).call();
        res.json(details);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get votes for a specific option in a poll
app.get('/votes/:pollId/:optionIndex', async (req, res) => {
    const { pollId, optionIndex } = req.params;
    try {
        const votes = await contract.methods.getVotes(pollId, optionIndex).call();
        res.json({ votes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
