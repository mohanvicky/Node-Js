// OTP Model
const mongoose = require('mongoose');
const { use } = require('../routes/user.routes');

const OTPSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // automatically delete after 10 minutes (600 seconds)
    }
});

module.exports = mongoose.model('OTP', OTPSchema);