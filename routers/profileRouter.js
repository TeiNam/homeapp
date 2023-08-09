const express = require('express');
const { connectMongo } = require('../modules/mongoConnector');
const { decrypt } = require('../modules/crypto');
const bcrypt = require('bcrypt');
const tokenService = require('../modules/jwtAuth');

const dbName = 'homeApp';
const collectionName = 'user';

let usersCollection;

(async () => {
    usersCollection = await connectMongo(dbName, collectionName);
})();

const router = express.Router();

router.get('/', async (req, res) => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
        return res.status(401).send('Access Denied: No Refresh Token Provided!');
    }

    try {
        const { userId } = await tokenService.validateRefreshToken(refreshToken);
        const user = await usersCollection.findOne({ userId: userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const userProfile = {
            imageUrl: user.profile.imageUrl || 'defaultImageUrl',
            userId: user.userId,
            nickName: user.profile.nickName,
            birthday: user.profile.birthday,
            introduce: user.profile.introduce,
        };

        res.render('profile', { user: userProfile });
    } catch (err) {
        res.status(400).send('Invalid Refresh Token');
    }
});


router.post('/', async (req, res) => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
        return res.status(401).send('Access Denied: No Refresh Token Provided!');
    }

    try {
        const { userId } = await tokenService.validateRefreshToken(refreshToken);
        const { password, nickName, imageUrl, birthday, introduce } = req.body;

        const user = await usersCollection.findOne({ userId: userId });

        // Check if provided password matches the user's password
        const isPasswordMatch = await bcrypt.compare(password, decrypt(user.password));

        if (!isPasswordMatch) {
            return res.status(401).send('패스워드가 틀렸습니다..');
        }

        const updatedProfile = {
            profile: {
                nickName,
                imageUrl,
                birthday,
                introduce,
            },
        };
        await usersCollection.updateOne({ userId: userId }, { $set: updatedProfile });

        res.status(200).send('프로필이 수정되었습니다.');
    } catch (err) {
        res.status(400).send('Invalid Refresh Token');
    }
});

module.exports = router;
