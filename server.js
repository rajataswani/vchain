const express = require('express');
const Web3 = require('web3');
const contractABI = require('./path/to/PollingSystemABI.json');
const PocketBase = require('pocketbase');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const web3 = new Web3('YOUR_WEB3_PROVIDER_URL');
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contract = new web3.eth.Contract(contractABI, contractAddress);
const pb = new PocketBase('http://127.0.0.1:8090');

// Create a rate limiter to prevent DDoS attacks
const rateLimiter = new RateLimiterMemory({
    points: 10, // 10 requests
    duration: 1, // per 1 second
});

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

// Signup endpoint
app.post('/auth/signup', async (req, res) => {
    try {
        // Check rate limiting
        const ip = req.ip;
        const rateLimitKey = `ratelimit-signup-${ip}`;
        const isRateLimited = await rateLimiter.consume(rateLimitKey);
        if (isRateLimited) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }

        // Perform user registration with PocketBase
        const { uid, pwd, ph } = req.body;
        const userData = { uid, pwd, ph };
        const newUser = await pb.collection('users').create(userData);

        // Return user data
        res.json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
    try {
        // Check rate limiting
        const ip = req.ip;
        const rateLimitKey = `ratelimit-login-${ip}`;
        const isRateLimited = await rateLimiter.consume(rateLimitKey);
        if (isRateLimited) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }

        // Perform user authentication with PocketBase
        const { uid, pwd } = req.body;
        const authData = await pb.collection('users').authWithEmailPassword(uid, pwd);

        // Return auth data
        res.json(authData);
    } catch (error) {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/auth/logout', async (req, res) => {
    try {
        // Check rate limiting
        const ip = req.ip;
        const rateLimitKey = `ratelimit-logout-${ip}`;
        const isRateLimited = await rateLimiter.consume(rateLimitKey);
        if (isRateLimited) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }

        // "Logout" the last authenticated model
        pb.authStore.clear();
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
