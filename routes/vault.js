const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const transporter = require("../mailer");
const uniqid = require("uniqid");
const bcrypt = require('bcrypt');
const crypto = require("crypto-js");
const checkauth = require("../middleware/checkauth");



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
            mailOptions.subject = "Not a User!";
            mailOptions.to = email;
            mailOptions.html = `<h2> You Do not have a Vault with us, Fear not to set up vault services go to (POST)localhost:9000/api/vault/myvault/create with your email and pass to register vault and retrive your vault</p>`;
            transporter.sendMail(mailOptions).then(() => {
                res.status(404).send({
                    status: "No vault deteted",
                    message: "Not a vault user"
                });
            });
        }
        else {
            if (code === null && password === null) {
                res.status(404).send({
                    status: "password or vault code not detected",
                    message: "Enter your Entry password and vault code"
                });
            }
            else {
                admin.database().ref(`/vault/${data.email}/entryPass`).once("value").then((snapshot) => {
                    if (bcrypt.compareSync(password, snapshot.val())) {
                        try {

                            admin.database().ref(`/vault/${data.email}/${vaultid}/Data`).once("value").then((snapshot) => {
                                let EncryptedData = snapshot.val();
                                let decrypted = crypto.AES.decrypt(EncryptedData, email + code);
                                let DecryptedData = JSON.parse(decrypted);
                                /*for (const field in EncryptedData) {
                                   //var decrypted = CryptoJS.AES.decrypt(EncryptedData[field],code);
                                    DecryptedData[field] = EncryptedData[field];
                                }*/
                                admin.database().ref(`/vault/${data.email}/${vaultid}/secret/`).once("value").then((snapshot) => {
                                    if (bcrypt.compareSync(code, snapshot.val())) {
                                        mailOptions.to = email;
                                        mailOptions.subject = "Vault Data Retrieved!";
                                        mailOptions.html = `<h2>DATA:</h2><p>${JSON.stringify(DecryptedData) || JSON.stringify(EncryptedData)}</p>`;
                                        transporter.sendMail(mailOptions).then(() => {
                                            res.status(201).send({
                                                status: "Vault Data retrived",
                                                message: "Data sent to your email"
                                            });
                                        });
                                    }
                                    else {
                                        mailOptions.to = email;
                                        mailOptions.subject = "Someone tried to accesss Vault Data!";
                                        mailOptions.html = `<h2>DATA might be endanggered</h2><p>Might be best to change vault</p>`;
                                        transporter.sendMail(mailOptions).then(() => {
                                            res.status(201).send({
                                                status: "Vault Data not retrived",
                                                error: "incorrect code or Access Password ",
                                                message: "Enter code and Access password properly"
                                            });
                                        });

                                    }
                                })
                            })
                        }
                        catch {

                            res.status(201).send({
                                status: "Vault Data not retrived",
                                error: "incorrect code or Access Password ",
                                message: "Enter code and Access password properly"
                            });
                        }
                    }
                    else {
                        mailOptions.to = email;
                        mailOptions.subject = "Someone tried to accesss Vault Data!";
                        mailOptions.html = `<h2>DATA might be endanggered</h2><p>Might be best to change vault</p>`;
                        transporter.sendMail(mailOptions).then(() => {
                            res.status(201).send({
                                status: "Vault Data not retrived",
                                error: "incorrect code or Access Password ",
                                message: "Enter code and Access password properly"
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
    let vaultData = data.Data;

    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "",
        subject: "", // Subject line
        html: "", // plain text body
    };



    admin.database().ref(`/vault/${data.email}/`).once("value").then((snapshot) => {
        if (snapshot.val() === null) {

            mailOptions.subject = "Not a User!";
            mailOptions.to = email;
            mailOptions.html = `<h2> You Do not have a Vault with us, Fear not to set up vault services go to (POST)localhost:9000/api/vault/myvault/create with your email and pass to register vault and retrive your vault</p>`;
            transporter.sendMail(mailOptions).then(() => {
                res.status(404).send({
                    status: "No vault deteted",
                    message: "Not a vault user"
                });
            });

        }
        else {
            if (code === null && password === null) {
                res.status(404).send({
                    status: "password or vault code not detected",
                    message: "Enter your Entry password and vault code"
                });
            }
            else {
                admin.database().ref(`/vault/${data.email}/entryPass`).once("value").then((snapshot) => {
                    if (bcrypt.compareSync(password, snapshot.val())) {
                        console.log("i like myself");
                        try {
                            let dataString = JSON.stringify(vaultData);
                            var encrypted = crypto.AES.encrypt(dataString, code).toString();

                            // var decrypted = crypto.AES.decrypt(encrypted, mail + code);
                            // console.log(decrypted);
                            console.log(encrypted);
                            var bytes = crypto.AES.decrypt(encrypted, code);
                            var decryptedData = JSON.parse(bytes.toString(crypto.enc.Utf8));
                            console.log(decryptedData);
                            let EncryptedData = encrypted.toString;
                            let finalData = EncryptedData();
                            console.log(finalData);


                            /*for (const field in vaultData) {

                                /*var encrypted = CryptoJS.AES.encrypt(vaultData[field],code);
                                console.log(CryptoJS.AES.decrypt(encrypted,code));
                                EncryptedData[field] = encrypted;//bcrypt.hashSync(vaultData[field],10);
                                EncryptedData[field] = vaultData[field];         
                                
                            }*/
                            admin.database().ref(`/vault/${data.email}/${vaultid}/secret`).once("value").then((snapshot) => {
                                if (bcrypt.compareSync(code, snapshot.val())) {

                                    admin.database().ref(`vault/${data.email}/${vaultid}/`).update({ data: finalData }).then(function () {
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


