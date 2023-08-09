// crypto.js
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

let key = Buffer.from(process.env.AES256_KEY, 'hex');
let algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';

function encrypt(text) {
    if (!text) {
        throw new Error('Text to encrypt must be a non-empty string or buffer.');
    }

    let salt = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(algorithm, key, salt);
    let cipherUpdate = cipher.update(text, 'utf8', 'base64');
    let encryptedText = cipherUpdate + cipher.final('base64');

    return `${salt.toString('hex')}:${encryptedText}`;
}

function decrypt(encryptedText) {
    if (!encryptedText.includes(':')) {
        throw new Error('Invalid encrypted text. Salt and encrypted text should be separated by ":"');
    }

    let [salt, encText] = encryptedText.split(':');
    let decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(salt, 'hex'));
    let decipherUpdate = decipher.update(encText, 'base64', 'utf8');
    let decryptedText = decipherUpdate + decipher.final('utf8');

    return decryptedText;
}

module.exports = {
    encrypt,
    decrypt,
};
