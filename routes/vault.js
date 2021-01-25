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
            if (code === undefined || password === undefined || vaultid === undefined || vaultData === undefined) {
                res.status(401).send({
                    success: false,
                    message: "'code', 'vaultid', 'data' and 'password' parameters are required to access your vault and insert data"
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
                                        res.status(201).send({
                                            success: true,
                                            message: "Vault Data Inserted, data now available to be read, do not forget/misplace your code and password since it cannot be retrieved again"
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

    if (code === undefined || password === undefined) {
        res.status(404).send({
            success: false,
            message: "'code' and 'password' parameters are required"
        });
    } else {
        admin.database().ref(`/vault/${data.email}/`).once("value").then((snapshot) => {
            if (snapshot.val() === null) {
                let vaultid = uniqid();
                let mainPass = bcrypt.hashSync(password, 10);
                let safepass = bcrypt.hashSync(code, 10);
                console.log(safepass);
                admin.database().ref(`/vault/${data.email}/`).set({ entryPass: mainPass }).then(() => {
                });
                admin.database().ref(`/vault/${data.email}/${vaultid}`).set({ secret: safepass, data: null }).then(() => {
                    mailOptions.subject = "Vaultid: Do not share!";
                    mailOptions.to = email;
                    mailOptions.html = createTemplate(`Vault Created`, `Hey, this is to inform you that your vault has been sucessfully created, find the cault code below. DO NOT ever share your vault ID or any other credentials with anyone.<br /><br /> <h2>${vaultid}</h2>`)
                    transporter.sendMail(mailOptions).then(() => {
                        res.status(201).send({
                            success: true,
                            message: "Vault created, Vault ID sent to your mail, Vault data now accessible to read/write"
                        });
                    });
                }).catch((err) => {
                    res.status(500).send({
                        success: false,
                        message: "Exception Occurred, Pease retry your request"
                    });
                });
            }
            else {
                admin.database().ref(`/vault/${data.email}/entryPass/`).once("value").then((snapshot) => {
                    if (bcrypt.compareSync(password, snapshot.val())) {
                        let vaultid = uniqid();
                        let safepass = bcrypt.hashSync(code, 10);
                        admin.database().ref(`/vault/${data.email}/${vaultid}/`).set({ secret: safepass, data: null }).then(() => {
                            mailOptions.subject = "Vaultid: Do not share!";
                            mailOptions.to = email;
                            mailOptions.html = createTemplate(`Vault Created`, `Hey, this is to inform you that your vault has been sucessfully created, find the Vault ID below. DO NOT ever share your vault ID or any other credentials with anyone.<br /><br /> <h2>${vaultid}</h2>`)
                            transporter.sendMail(mailOptions).then(() => {
                                res.status(201).send({
                                    success: true,
                                    message: "Vault created, Vault ID sent to your mail, Vault data now accessible to read/write"
                                });
                            });
                        })
                    }
                    else {
                        mailOptions.to = email;
                        mailOptions.subject = "ALERT: Vault Creation Detected",
                            mailOptions.html = createTemplate(`Vault Creation Attempt Blocked`, `Hey, this is to notify you that someone tried to create a vault inside your node using your email address. We have successfully blocked this attempt.`)
                        transporter.sendMail(mailOptions).then(() => {
                            res.status(401).send({
                                success: false,
                                message: "Incorrect or insufficient credentials provided"
                            });
                        });
                    }
                })



            }
        });
    }
});

router.delete("/myvault/delete", checkauth, (req, res) => {
    let data = req.body;
    let email = data.email;
    let password = data.password;
    let code = data.code;
    let vaultid = data.vaultid;
    let userOpt = data.option;
    data.email = email.split(".").join("_");

    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "",
        subject: "", // Subject line
        html: "", // plain text body
    };

    if (password === undefined || code === undefined) {
        res.status(404).send({
            success: false,
            message: "'code' and 'password' parameters are required"
        });
    } else {
        admin.database().ref(`/vault/${data.email}/`).once("value").then((snapshot) => {
            if (snapshot.val() === null) {
                res.status(404).send({
                    success: false,
                    message: "User is not a vault user, No vault asscoiated with them, to attain a vault, create a vault"
                });
            }
            else {
                switch (userOpt) {
                    case "node":
                        try {
                            admin.database().ref(`/vault/${data.email}/entryPass/`).once("value").then((snapshot) => {
                                if (bcrypt.compareSync(password, snapshot.val())) {
                                    admin.database().ref(`/vault/${data.email}/`).remove().then(() => {
                                        mailOptions.to = email;
                                        mailOptions.subject = "Vault Node REMOVED";
                                        mailOptions.html = createTemplate("You have succesfully deleted your Vault Node", "We're sorry to see you go, All vaults in your node has been destroyed, We hope to see you again.");
                                        transporter.sendMail(mailOptions).then(() => {
                                            res.status(202).send({
                                                success: true,
                                                message: "Vault Node has been deleted along with every vault present within it"
                                            });
                                        });
                                    })
                                }
                                else {
                                    mailOptions.to = email;
                                    mailOptions.subject = "Vault Node Deletion Attempt BLOCKED!";
                                    mailOptions.html = createTemplate("Deletion of Vault NODE BLOCKED", "Authentication failed so we bloacked the deletion attempt, Never share your vault details with anyone");
                                    transporter.sendMail(mailOptions).then(() => {
                                        res.status(401).send({
                                            success: false,
                                            message: "Vault Node deletion BLOCKED, Authentication Failed"
                                        });
                                    });

                                }
                            });
                        }
                        catch {
                            res.status(401).send({
                                success: failed,
                                message: "Vault Node deletion BLOCKED, Authentication Failed"
                            });

                        }

                        break;
                    case "vault": try {
                        if (vaultid === undefined) {
                            res.status(404).send({
                                success: false,
                                message: "'vaultid' parameter is required"
                            });
                        } else {
                            admin.database().ref(`/vault/${data.email}/entryPass/`).once("value").then((snapshot) => {
                                if (bcrypt.compareSync(password, snapshot.val())) {
                                    admin.database().ref(`/vault/${data.email}/${vaultid}/secret`).once("value").then((snapshot) => {
                                        if (snapshot.val() === null) {
                                            res.status(404).send({
                                                success: false,
                                                error: "This vault does not exist within this node"
                                            })
                                        } else {
                                            if (bcrypt.compareSync(code, snapshot.val())) {
                                                admin.database().ref(`/vault/${data.email}/${vaultid}/`).remove().then(() => {
                                                    mailOptions.to = email;
                                                    mailOptions.subject = `Vault ${vaultid} REMOVED`;
                                                    mailOptions.html = createTemplate(`You have succesfully deleted Vault ${vaultid}`, "We're sorry to see you go, All data in your vault has been destroyed, We hope to see you again.");
                                                    transporter.sendMail(mailOptions).then(() => {
                                                        res.status(202).send({
                                                            success: true,
                                                            message: "Vault has been successfully deleted and all data has been erased"
                                                        });
                                                    });
                                                });
                                            }
                                            else {
                                                mailOptions.to = email;
                                                mailOptions.subject = "Vault Deletion Attempt BLOCKED!";
                                                mailOptions.html = createTemplate("Deletion of Vault BLOCKED", "Authentication failed so we blocked the deletion attempt, Never share your vault details with anyone");
                                                transporter.sendMail(mailOptions).then(() => {
                                                    res.status(401).send({
                                                        success: "failed",
                                                        message: "Vault deletion BLOCKED, Authentication Failed"
                                                    });
                                                });
                                            }
                                        }

                                    })


                                }
                                else {
                                    mailOptions.to = email;
                                    mailOptions.subject = "Vault Deletion Attempt BLOCKED!";
                                    mailOptions.html = createTemplate("Deletion of Vault BLOCKED", "Authentication failed so we bloacked the deletion attempt, Never share your vault details with anyone");
                                    transporter.sendMail(mailOptions).then(() => {
                                        res.status(401).send({
                                            success: false,
                                            message: "Vault deletion BLOCKED, Authentication Failed"
                                        });
                                    });
                                }
                            })
                        }

                    }
                        catch {
                            res.status(401).send({
                                success: false,
                                message: "Vault deletion BLOCKED, Authentication Failed"
                            });


                        }
                        break;

                    default: res.status(404).send({
                        success: false,
                        message: "Deletion 'option' parameter required, Either (vault) for singular vault or (node) for Vault Node"
                    });
                }

            }
        })
    }
});


module.exports = router;