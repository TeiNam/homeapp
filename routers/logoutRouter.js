const express = require('express');
const router = express.Router();
const jwtAuth = require('../modules/jwtAuth');

(async() => {
    await jwtAuth.initialize();
})();

router.post('/', async (req, res) => {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
        return res.status(400).send('Refresh token is missing');
    }

    try {
        const validation = await jwtAuth.validateRefreshToken(refreshToken);

        if (!validation) {
            return res.status(401).send('Invalid refresh token');
        }

        await jwtAuth.invalidateRefreshToken(refreshToken);
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.status(200).send({ message: '로그아웃 성공', redirectTo: '/login' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
