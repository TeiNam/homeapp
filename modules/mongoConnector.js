// mongoConnector.js
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });

let isConnected = false;

async function connectMongo(dbName, collectionName) {
    try {
        if (!isConnected) {
            await client.connect();
            isConnected = true;
        }
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        return collection;
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

module.exports = { connectMongo };
