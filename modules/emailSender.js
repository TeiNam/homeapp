// Import modules/packages
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cryptoUtil = require('../modules/crypto');

// Import env variables
const { NAVER_EMAIL_USER, NAVER_EMAIL_PASSWORD, JWT_EMAIL_VERIFICATION_SECRET } = process.env;

// Configure SMTP
const smtpConfig = {
    host: 'smtp.naver.com',
    port: 587,
    secure: false,  // use StartTLS
    requireTLS: true,
    auth: {
        user: NAVER_EMAIL_USER,
        pass: NAVER_EMAIL_PASSWORD
    }
};

// Create transporter object
const transporter = nodemailer.createTransport(smtpConfig);

// Verify email function
// Verify email function
async function sendEmailVerificationLink(user) {
    const token = jwt.sign({ userId: user.userId }, JWT_EMAIL_VERIFICATION_SECRET, { expiresIn: '1h' });
    const verificationLink = `http://127.0.0.1:3000/verify-email?token=${token}`;

    const mailOptions = {
        from: NAVER_EMAIL_USER,
        to: cryptoUtil.decrypt(user.email),
        subject: 'Email Verification',
        text: `Click on the link to verify your email: ${verificationLink}`,
        html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`
    };

    try {
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email: ', error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    resolve(info);
                }
            });
        });
    } catch (error) {
        console.error('Error in sendEmailVerificationLink: ', error);
        throw error;
    }
}

// Token validation function
function validateEmailVerificationToken(token) {
    try {
        const payload = jwt.verify(token, JWT_EMAIL_VERIFICATION_SECRET);
        return payload.userId;
    } catch (err) {
        console.error(err);
        if (err.name === 'TokenExpiredError')
            throw new Error('Verification link expired');
        else
            throw new Error('Invalid token');
    }
}

// Export functions
module.exports = { sendEmailVerificationLink, validateEmailVerificationToken };