const process = require('process');
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const NodeCache = require('node-cache');

const tokens = new NodeCache({ stdTTL: 60*60 });
const IS_DEBUG = process.env.NODE_ENV === 'test';
const HASH = IS_DEBUG
    ? '$2a$04$HhSgVBdJWxoi/sP3rxQeruxihNsIiX2UbT4mcoeywbYzlikJeqiAa'
    : '$2a$10$qgKVcgqHEIuxaVvVR/4eeebQMZWyRoUbcPJqDHZ8soHN4JlJYkjPy';

function needs_auth(req, res, next) {
    const token = req.cookies.token;
    if (token && tokens.get(token)) {
        // refresh TTL
        tokens.ttl(token);
        next();
        return;
    }
    res.status(401);
    res.end();
}

function save_token(res) {
    const token = uuidv4();
    res.cookie('token', token);
    tokens.set(token, true);
}

function authenticate(username, password) {
    // Constant time authentication function
    let valid = true;
    valid = valid && crypto.timingSafeEqual(Buffer.from(username, 'utf-8'), Buffer.from('admin', 'utf-8'));
    valid = valid && bcrypt.compareSync(password, HASH);
    return valid;
}

module.exports = {
    needs_auth,
    save_token,
    authenticate,
};
