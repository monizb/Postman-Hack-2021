const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");

//checkAuth import 
const chechAuth = require('../middleware/checkauth');

router.get('/check', (req, res) => {
    res.status(200).json({ "works":"yes"});

});

router.post('/subscribe', ( req, res) => {
});



module.exports = router;