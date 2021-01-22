const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    secure: true,
    port: 465,
    auth: {
        user: "postman.hack@techstax.co",
        pass: "postman2021",
    },
});

module.exports = transporter;