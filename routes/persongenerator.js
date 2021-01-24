const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();
var Fakerator = require("fakerator");
var fakerator = Fakerator();


router.get("/people/:gender/:qty", (req, res) => {
    const qty = Number(req.params.qty) > 5000 ? 5000 : req.params.qty;
    const genderArray = ["male", "female", "mixed"];
    const gender = req.params.gender;
    const people = [];
    if (genderArray.indexOf(gender) === -1) {
        res.status(500).send({
            success: false,
            error: "gender should be either male,female or mixed"
        })
    } else {
        if (gender === "male") {
            for (let i = 0; i < qty; i++) {
                people.push(fakerator.entity.user("M"));
            }
            res.send({
                success: true,
                people: people
            })
            sendJSONFile(people);
        }
        if (gender === "female") {
            for (let i = 0; i < qty; i++) {
                people.push(fakerator.entity.user("F"));
            }
            res.send({
                success: true,
                people: people
            })
        }
        if (gender === "mixed") {
            for (let i = 0; i < qty; i++) {
                people.push(fakerator.entity.user());
            }
            res.send({
                success: true,
                people: people
            })
        }

    }
})

router.get("/address/:qty", (req, res) => {
    const qty = Number(req.params.qty) > 5000 ? 5000 : req.params.qty;
    const address = [];
    for (let i = 0; i < qty; i++) {
        address.push(fakerator.entity.address());
    }
    res.send({
        success: true,
        address: address
    })
})

router.get("/company/:qty", (req, res) => {
    const qty = Number(req.params.qty) > 5000 ? 5000 : req.params.qty;
    const company = [];
    for (let i = 0; i < qty; i++) {
        company.push(fakerator.entity.company());
    }
    res.send({
        success: true,
        company: company
    })
})

router.get("/blog/:qty", (req, res) => {
    const qty = Number(req.params.qty) > 5000 ? 5000 : req.params.qty;
    const blog = [];
    for (let i = 0; i < qty; i++) {
        blog.push(fakerator.entity.post());
    }
    res.send({
        success: true,
        blog: blog
    })
})

router.get("/uuid/:qty", (req, res) => {
    const qty = Number(req.params.qty) > 10000 ? 10000 : req.params.qty;
    const uuid = [];
    for (let i = 0; i < qty; i++) {
        uuid.push(fakerator.misc.uuid());
    }
    res.send({
        success: true,
        uuid: uuid
    })
})

router.get("/email/:qty", (req, res) => {
    const qty = Number(req.params.qty) > 10000 ? 10000 : req.params.qty;
    const email = [];
    for (let i = 0; i < qty; i++) {
        email.push(fakerator.internet.email());
    }
    res.send({
        success: true,
        email: email
    })
})

router.get("/lorem/:entity/:qty", (req, res) => {
    const qty = Number(req.params.qty) > 5000 ? 5000 : req.params.qty;
    const genderArray = ["word", "sentence", "paragraph"];
    const gender = req.params.entity;
    const people = [];
    if (genderArray.indexOf(gender) === -1) {
        res.status(500).send({
            success: false,
            error: "entity should be word, sentence, or paragraph"
        })
    } else {
        if (gender === "word") {
            for (let i = 0; i < qty; i++) {
                people.push(fakerator.lorem.word());
            }
            res.send({
                success: true,
                lorem: people
            })
        }
        if (gender === "sentence") {
            for (let i = 0; i < qty; i++) {
                people.push(fakerator.lorem.sentence());
            }
            res.send({
                success: true,
                lorem: people
            })
        }
        if (gender === "paragraph") {
            for (let i = 0; i < qty; i++) {
                people.push(fakerator.lorem.paragraph());
            }
            res.send({
                success: true,
                lorem: people
            })
        }

    }
})

router.get("/custom/:qty", (req, res) => {
    const qty = Number(req.params.qty) > 10000 ? 10000 : req.params.qty;
    const strings = [];
    const data = req.body;
    if (data.template === undefined) {
        res.status(500).send({
            success: false,
            error: "'template' parameter is required"
        })
    } else {
        for (let i = 0; i < qty; i++) {
            strings.push(fakerator.populate(data.template));
        }
        res.send({
            success: true,
            custom: strings
        })
    }

})

module.exports = router;