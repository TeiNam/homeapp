//accessLogger.js
const { connectMongo } = require('./mongoConnector');

const dbName = 'log';
const collectionName = 'userAccessLog';

let loginLogCollection;

async function initialize() {
    loginLogCollection = await connectMongo(dbName, collectionName);
}

initialize();

async function logActionAttempt(action, user_id, isSuccess, clientIP, reason = null) {
    const log = {
        user_id,
        action,
        isSuccess,
        clientIP,
        reason,
        timestamp: new Date(),
    };

    await loginLogCollection.insertOne(log);
}

async function logLoginAttempt(user_id, isSuccess, clientIP, reason = null) {
    return await logActionAttempt('login', user_id, isSuccess, clientIP, reason);
}

async function logLogoutAttempt(user_id, isSuccess, clientIP, reason = null) {
    return await logActionAttempt('logout', user_id, isSuccess, clientIP, reason);
}

module.exports = {
    logLoginAttempt,
    logLogoutAttempt
};