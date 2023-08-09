const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { connectMongo } = require('../modules/mongoConnector');
const { decrypt } = require('../modules/crypto');
const tokenService = require('../modules/jwtAuth');
const { logLoginAttempt } = require('../modules/accessLogger');
const getClientIP = require('../modules/getClientIP');
const { sendEmailVerificationLink } = require('../modules/emailSender');

const dbName = process.env.DB_NAME || 'homeApp';
const collectionName = 'user';

let usersCollection;

async function initialize() {
    try {
        usersCollection = await connectMongo(dbName, collectionName);
        await tokenService.initialize();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

(async function() {
    try {
        await initialize();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();


router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', getClientIP, handleLogin);

async function handleLogin(req, res) {
    try {
        const { loginUserId, loginPassword } = req.body;
        const foundUser = await usersCollection.findOne({ userId: loginUserId });

        const clientIP = req.ipAddress;

        if (!foundUser) {
            await logLoginAttempt(loginUserId, false, clientIP, 'ID가 존재하지 않습니다.');
            return res.status(400).send('ID가 존재하지 않습니다.');
        }

        if (foundUser.auth.emailYn === 'N') {
            try {
                await sendEmailVerificationLink(foundUser);
                return res.status(401).send('로그인 전에 이메일 인증을 완료하세요. 인증 이메일을 다시 보냈습니다.');
            } catch (error) {
                console.error('Error resending verification email: ', error);
                return res.status(500).send('Failed to resend verification email.');
            }
        }

        const isPasswordMatch = await bcrypt.compare(loginPassword, decrypt(foundUser.password));

        if (!isPasswordMatch) {
            await logLoginAttempt(loginUserId, false, clientIP, '비밀번호가 틀립니다.');
            return res.status(400).send('비밀번호가 틀립니다.');
        }

        const accessToken = tokenService.generateAccessToken(foundUser.userId);
        const refreshToken = await tokenService.generateRefreshToken(foundUser.userId);

        await logLoginAttempt(loginUserId, true, clientIP, '접속 성공');
        res.cookie('access_token', accessToken, { httpOnly: true });
        res.cookie('refresh_token', refreshToken, { httpOnly: true });
        res.status(200).send({ message: '로그인 성공', redirectTo: '/main' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = router;
