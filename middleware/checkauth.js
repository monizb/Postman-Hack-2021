const express = require("express");
const admin = require("firebase-admin");

module.exports = (req, res, next) => {
    try {
        let data = req.body;
        if (data.email === undefined) {
            res.status(401).send({
                success: false,
                error: "'email' parameter are required"
            });
        } else {

            next();
        }

    }
    catch {
        return res.status(401).json({
            success: false,
            message: 'Auth failed!'
        });

    }
}