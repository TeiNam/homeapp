const express = require('express');
const bcrypt = require('bcrypt');

const { connectMongo } = require('../modules/mongoConnector');
const { encrypt } = require('../modules/crypto');
const { sendEmailVerificationLink } = require('../modules/emailSender');

const router = express.Router();
const dbName = 'homeApp';
const collectionName = 'user';
let usersCollection;

(async () => {
    usersCollection = await connectMongo(dbName, collectionName);
})();

const handleValidationError = (res, message) => {
    return res.status(400).send(message);
};

const checkUserId = (userId) => {
    const validUserIdRegex = /^[a-z0-9]+$/;
    return validUserIdRegex.test(userId);
};

const checkExistingUserWithField = async (field, value) => {
    const query = {[field]: value};
    const existingUser = await usersCollection.findOne(query);
    return existingUser != null;
};

const createStoreUser = async (userId, password, email, nickName, res) => {
    if (!checkUserId(userId)) return handleValidationError(res, '영어와 숫자만 이용가능합니다.');

    if (await checkExistingUserWithField('userId', userId)) return handleValidationError(res, '이미 존재하는 ID 입니다.');

    if (await checkExistingUserWithField('profile.nickName', nickName)) return handleValidationError(res, '이미 존재하는 닉네임입니다.');

    const encryptedEmail = encrypt(email);
    if (await checkExistingUserWithField('email', encryptedEmail)) return handleValidationError(res, '이미 등록된 email 입니다.');

    const hashedPassword = await bcrypt.hash(password, 10);
    const encryptedPassword = encrypt(hashedPassword);

    const user = {
        userId,
        password: encryptedPassword,
        email: encryptedEmail,
        profile: {nickName, family: null, imageUrl: null, birthday: null, introduce: null},
        auth: {emailYn: "N", authDate: null},
        joinDate: new Date()
    };
    await usersCollection.insertOne(user);
    try {
        await sendEmailVerificationLink(user);
        res.status(201).send('인증 메일을 발송했습니다. 인증을 완료하시면 가입이 완료됩니다.');
    } catch (error) {
        console.error('Error sending verification email: ', error);
        return res.status(500).send('Failed to send verification email.');
    }
};

router.get('/', (req, res) => res.render('signup'));

router.post('/', async (req, res) => {
    const {userId, password, email, nickName} = req.body;
    try {
        await createStoreUser(userId, password, email, nickName, res);
    } catch (err) {
        console.error(err);
        if (err.code === 11000) return res.status(400).send('이미 존재하는 ID 입니다.');
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = router;