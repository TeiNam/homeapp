// expressRouter.js
const express = require('express');
const router = express.Router();
const { validateEmailVerificationToken } = require('../modules/emailSender');
const { connectMongo } = require('../modules/mongoConnector');

// Wrap async handlers to catch and propagate errors properly.
const asyncWrapper = callback => {
    return (req, res, next) => {
        callback(req, res, next).catch(next);
    };
}

const dbName = 'homeApp';
const collectionName = 'user';
let usersCollection;

(async () => {
    usersCollection = await connectMongo(dbName, collectionName);
})();

router.get('/verify-email', asyncWrapper(async (req, res) => {
    const token = req.query.token;

    if (!token) {
        res.status(400).render('verify-email', { message: 'No token provided.' });
        return;
    }

    try {
        const userId = await validateEmailVerificationToken(token);
        // Update the user's record in the database to indicate that their email has been verified
        const user = await usersCollection.findOne({ userId });
        user.auth.emailYn = 'Y';
        user.auth.authDate = new Date();
        await usersCollection.updateOne({ userId }, { $set: { auth: user.auth } });
        res.render('verify-email', { message: `Email verified for user ${userId}` });
    } catch (err) {
        res.status(400).render('verify-email', { message: err.message });
    }
}));

module.exports = router;
