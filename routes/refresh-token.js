const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { generateAccessToken } = require('../server/jwt');
const read_secret = require('../server/secret_reader');
const JWT_REFRESH_SECRET = read_secret('jwt_refresh_secret');
const { redisClient } = require('../db/redis_connect');
const User = require('../models/user');

router.get('/', (req, res) => {
    const refreshToken = req?.cookies?.jwt

    if (!refreshToken) return res.sendStatus(401);

    redisClient.GET(refreshToken, async (err, emailValue) => {
        if (err) console.log(err);
        if (!emailValue) return res.sendStatus(403);

        try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            const newToken = generateAccessToken(decoded.email);

            const user = await User.getUserByEmail(decoded.email);

            res.json({ accessToken: newToken, roles: user.roles }).status(200);
        } catch (err) {
            console.log(err);
            return res.sendStatus(403);
        }
    });


});

module.exports = router;
