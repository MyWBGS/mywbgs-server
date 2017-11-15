// @ts-check
const jwt = require('jsonwebtoken');
const config = require('config');

const secret = process.env.JWT_SECRET || config.get('jwt_secret');

/**
 * Encodes and signs a JWT
 * @param {object} data
 * @param {string} expiresIn
 * @returns {Promise<string>} token
 */
async function encode(data, expiresIn) {
    return new Promise((resolve, reject) => {
        jwt.sign(data, secret, {expiresIn}, (err, token) => {
            if(err) {
                reject(err);
            } else {
                resolve(token);
            }
        });
    })
}

/**
 * Verifies and decodes a JWT
 * @param {string} token
 * @param {Promise<object>} data 
 */
async function decode(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, data) => {
            if(err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

module.exports = {encode, decode};