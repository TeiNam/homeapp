const jwt = require('jsonwebtoken');
const { connectMongo } = require('../modules/mongoConnector');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const DB_NAME = process.env.DB_NAME || 'homeApp';
const COLLECTION_NAME = 'refreshTokens';

class ErrorHandler {
    static handleError(err) {
        console.error(err);
        throw err;
    }
}

class TokenService {
    constructor() {
        this.refreshTokensCollection = null;
    }

    async initialize() {
        try {
            this.refreshTokensCollection = await connectMongo(DB_NAME, COLLECTION_NAME);
        } catch (err) {
            ErrorHandler.handleError(err);
            process.exit(1);
        }
    }

    generateAccessToken(userId) {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
    }

    async generateRefreshToken(userId) {
        let refreshToken;

        try {
            const existingToken = await this.refreshTokensCollection.findOne({ userId });

            if (!existingToken) {
                refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
                await this.refreshTokensCollection.insertOne({
                    token: refreshToken,
                    userId,
                    createDate: new Date(Date.now())
                });
            } else {
                refreshToken = existingToken.token;
            }

        } catch (err) {
            ErrorHandler.handleError(err);
        }

        return refreshToken;
    }

    async validateRefreshToken(refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            const tokenInDb = await this.refreshTokensCollection.findOne({ token: refreshToken });

            if (!tokenInDb) {
                throw new Error('Invalid refresh token');
            }

            return { userId: payload.userId, refreshToken };
        } catch (err) {
            ErrorHandler.handleError(err);
        }

        return null;
    }

    async invalidateRefreshToken(refreshToken) {
        try {
            await this.refreshTokensCollection.deleteOne({ token: refreshToken });
        } catch (err) {
            ErrorHandler.handleError(err);
        }
    }
}

module.exports = new TokenService();
