const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const transporter = require("../mailer");
const uniqid = require("uniqid");
const bcrypt = require('bcrypt');
const crypto = require("crypto-js");
const checkauth = require("../middleware/checkauth");
const createTemplate = require("../htmltemplate");



router.get("/myvault", checkauth, (req, res) => {
    let data = req.body;
    let email = data.email;
    let password = data.password;
    let vaultid = data.vaultid;
    let code = data.code;

    data.email = email.split(".").join("_");
    let vaultPass = data.password;

    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "",
        subject: "", // Subject line
        html: "", // plain text body
    };

    admin.database().ref(`/vault/${data.email}/`).once("value").then((snapshot) => {
        if (snapshot.val() === null) {
            res.status(404).send({
                success: false,
                message: "Not a vault user, this user has no vault associated with them"
            });
        }
        else {
            if (code === undefined || password === undefined) {
                res.status(401).send({
                    success: false,
                    message: "'code' and 'password' parameters are required to access your vault"
                });
            }
            else {
                admin.database().ref(`/vault/${data.email}/entryPass`).once("value").then((snapshot) => {
                    if (bcrypt.compareSync(password, snapshot.val())) {
                        try {
                            admin.database().ref(`/vault/${data.email}/${vaultid}/data`).once("value").then((snapshot) => {
                                if (snapshot.val() === null) {
                                    res.status(404).send({
                                        success: false,
                                        error: "There is no such node associated with this vault"
                                    })
                                } else {
                                    try {
                                        let EncryptedData = snapshot.val();
                                        var bytes = crypto.AES.decrypt(EncryptedData, code);
                                        var decryptedData = JSON.parse(bytes.toString(crypto.enc.Utf8));
                                        admin.database().ref(`/vault/${data.email}/${vaultid}/secret/`).once("value").then((snapshot) => {
                                            if (bcrypt.compareSync(code, snapshot.val())) {
                                                mailOptions.to = email;
                                                mailOptions.subject = "Vault Data Retrieved!";
                                                mailOptions.html = createTemplate(`Data Retrieved From Vault`, `Hey, the data from your vault node <b>${vaultid}</b> has been successfully decrypted and received. Please find the data attached below: <br /><br/><h4>DATA:</h4><br><p style="padding: 5px;background-color: #F6F8F1;">${JSON.stringify(decryptedData)}</p>`)
                                                transporter.sendMail(mailOptions).then(() => {
                                                    res.status(201).send({
                                                        success: true,
                                                        message: "Data has been sucessfully retrieved and sent to the email associated with this Vault Node"
                                                    });
                                                });
                                            }
                                            else {
                                                mailOptions.to = email;
                                                mailOptions.subject = "ALERT: Someone tried to access your Vault Node Data";
                                                mailOptions.html = createTemplate(`Unauthorized vault access attempt blocked`, `This email has been sent to notify that someone has your Vault Node Id: <b>${vaultid}</b>. This attempt has been blocked, please refrain from sharing any ids related to your vault to help us better protect it.`)
                                                transporter.sendMail(mailOptions).then(() => {
                                                    res.status(401).send({
                                                        success: false,
                                                        message: "Incorrect or insufficient credentials provided"
                                                    });
                                                });

                                            }
                                        })
                                    } catch (error) {
                                        res.status(401).send({
                                            success: false,
                                            message: "Incorrect or insufficient credentials provided"
                                        });
                                    }
                                }
                            })
                        }
                        catch {
                            res.status(401).send({
                                success: false,
                                message: "Incorrect or insufficient credentials provided"
                            });
                        }
                    }
                    else {
                        mailOptions.to = email;
                        mailOptions.subject = "ALERT: Someone tried to access your Vault Node Data";
                        mailOptions.html = createTemplate(`Unauthorized vault access attempt blocked`, `This email has been sent to notify that someone has your Vault Node Id: <b>${vaultid}</b>. This attempt has been blocked, please refrain from sharing any ids related to your vault to help us better protect it.`)
                        transporter.sendMail(mailOptions).then(() => {
                            res.status(401).send({
                                success: false,
                                message: "Incorrect or insufficient credentials provided"
                            });
                        });
                    }
                });
            }

        }
    });




});


router.post("/myvault", checkauth, (req, res) => {
    let data = req.body;
    let email = data.email;
    let vaultid = data.vaultid;
    let password = data.password;
    data.email = email.split(".").join("_");
    let code = data.code;
    let vaultData = data.data;

    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "",
        subject: "", // Subject line
        html: "", // plain text body
    };



    admin.database().ref(`/vault/${data.email}/`).once("value").then((snapshot) => {
        if (snapshot.val() === null) {

            res.status(404).send({
                success: false,
                message: "Not a vault user, this user has no vault associated with them"
            });
        }
        else {
            if (code === undefined && password === undefined) {
                res.status(401).send({
                    success: false,
                    message: "'code' and 'password' parameters are required to access your vault"
                });
            }
            else {
                admin.database().ref(`/vault/${data.email}/entryPass`).once("value").then((snapshot) => {
                    if (bcrypt.compareSync(password, snapshot.val())) {
                        try {
                            let dataString = JSON.stringify(vaultData);
                            var encrypted = crypto.AES.encrypt(dataString, code).toString();

                            admin.database().ref(`/vault/${data.email}/${vaultid}/secret`).once("value").then((snapshot) => {
                                if (bcrypt.compareSync(code, snapshot.val())) {

                                    admin.database().ref(`vault/${data.email}/${vaultid}/`).update({ data: encrypted }).then(function () {
                                        mailOptions.subject = `Vault id ${vaultid} has Data!`;
                                        mailOptions.to = email;
                                        mailOptions.html = `<h2>You now have encrypted Data in your Vault<h2><p>If you want to retrieve your dataset go to (GET)localhost:9000/api/vault/myvault <br>Vault data now accessible to read and write</p>`;
                                        transporter.sendMail(mailOptions).then(() => {
                                            res.status(201).send({
                                                status: "vault data Inserted, vault data now accessible to read",
                                                message: "Do not forget your code and vaultID, Thank you for securing your data with us"
                                            });
                                        });
                                    });
                                }
                                else {
                                    mailOptions.to = email;
                                    mailOptions.subject = "New VAULT Access Attempt detected!",
                                        mailOptions.html = `<h2>Someone tried to access your vault with your email<h2><p>you already have an existing base in our system...to make a new vault or access your vaults go to (POST)localhost:9000/api/vault/myvault and (GET)loaclhost:9000/api/vault/myvault RESPT<p><br>`;
                                    transporter.sendMail(mailOptions).then(() => {
                                        res.status(404).send({
                                            status: "Vault not accessed",
                                            error: "Access password or vault code incorrect",
                                            message: "Enter the correct Access Password or Vault code correctly"
                                        });
                                    })
                                }
                            })
                        }
                        catch {
                            res.status(404).send({
                                status: "Vault not accessed",
                                error: "Access password or vault code incorrect",
                                message: "Enter the correct Access Password or Vault code correctly"
                            });
                        }
                    }
                    else {
                        mailOptions.to = email;
                        mailOptions.subject = "New VAULT Access Attempt detected!",
                            mailOptions.html = `<h2>Someone tried to access your vault with your email<h2><p>you already have an existing base in our system...to make a new vault or access your vaults go to (POST)localhost:9000/api/vault/myvault and (GET)loaclhost:9000/api/vault/myvault RESPT<p><br>`;
                        transporter.sendMail(mailOptions).then(() => {
                            res.status(404).send({
                                status: "Vault not accessed",
                                error: "Access password or vault code incorrect",
                                message: "Enter the correct Access Password or Vault code correctly"
                            });
                        });

                    }
                })

            }
        }
    })
});

router.post("/myvault/create", checkauth, (req, res, next) => {
    let data = req.body;
    let email = data.email;
    let password = data.password;
    let code = data.code;
    data.email = email.split(".").join("_");

    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "",
        subject: "", // Subject line
        html: "", // plain text body
    };



    admin.database().ref(`/vault/${data.email}/`).once("value").then((snapshot) => {
        if (snapshot.val() === null) {

            if (code === null && password === null) {
                res.status(409).send({
                    status: "password or vault code not detected",
                    message: "Enter your Entry password and vault code"
                });
            }
            else {
                let vaultid = uniqid();
                let mainPass = bcrypt.hashSync(password, 10);
                let safepass = bcrypt.hashSync(code, 10);
                console.log(safepass);
                admin.database().ref(`/vault/${data.email}/`).set({ entryPass: mainPass }).then(() => {
                    mailOptions.subject = "Vaultid: Do not share!";
                    mailOptions.to = email;
                    mailOptions.html = "<h2>Entry password added to the database<h2>";
                    transporter.sendMail(mailOptions);
                });
                admin.database().ref(`/vault/${data.email}/${vaultid}`).set({ secret: safepass, data: null }).then(() => {
                    mailOptions.subject = "Vaultid: Do not share!";
                    mailOptions.to = email;
                    mailOptions.html = `<h2> Do not share, This is your vault id<h2><p><h2>${vaultid}<h2><br>Vault data now accessible to read and write</p>`;
                    transporter.sendMail(mailOptions).then(() => {
                        res.status(201).send({
                            status: "vault created, vault id sent to your mail, vault data now accessible to read/write",
                            message: "Do not forget your code and vaultID"
                        });
                    });
                }).catch((err) => {
                    res.status(409).send({
                        status: "Vault not created",
                        error: err,
                        message: "Send req again with your email and new password to create a new vault"
                    });
                });

            }





        }
        else {

            admin.database().ref(`/vault/${data.email}/entryPass/`).once("value").then((snapshot) => {
                if (bcrypt.compareSync(password, snapshot.val())) {
                    let vaultid = uniqid();
                    let safepass = bcrypt.hashSync(code, 10);
                    admin.database().ref(`/vault/${data.email}/${vaultid}/`).set({ secret: safepass, data: null }).then(() => {
                        mailOptions.subject = "Vaultid: Do not share!";
                        mailOptions.to = email;
                        mailOptions.html = `<h2> Do not share, This is your vault id<h2><p><h2>${vaultid}<h2><br>new Vault created ,Vault data now accessible to read and write</p>`;
                        transporter.sendMail(mailOptions).then(() => {
                            res.status(201).send({
                                status: "vault created, vault id sent to your mail, new Vault created ,vault data now accessible to read/write",
                                message: "Do not forget your code and vaultID"
                            });
                        });
                    })
                }
                else {
                    mailOptions.to = email;
                    mailOptions.subject = "New VAULT Creation detected!",
                        mailOptions.html = `<h2>Some tried to make a new vault with your email<h2><p>you already have an existing base in our system...to make a new vault or access your vaults go to (POST)localhost:9000/api/vault/myvault and (GET)loaclhost:9000/api/vault/myvault RESPT<p><br>`;
                    transporter.sendMail(mailOptions).then(() => {
                        res.status(404).send({
                            status: "Vault not created",
                            error: "User already present",
                            message: "you might already have a vault present go to localhost:9000/api/vault/myvault to see your vault, if not use a different email"
                        });
                    });
                }
            })



        }
    });
});


module.exports = router;