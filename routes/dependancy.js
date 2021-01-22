const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkauth");

const dependArr = [];

router.get('/tracked', checkAuth, (req, res) => {
    res.status(200).send({
        dependancies: dependArr
    });

})

router.post('/set', checkAuth, (req, res) => {

    let dependancies = req.body.dep;
    try{
        if (dependancies == undefined){
            res.status(404).send({
                success: "plz add dependacies",
                error: "no dependancies found"
            });
        }
        else{
            dependArr.push(dependancies);
            doc = Object.keys(dependancies);
            res.status(200).send({
                success: "dependancies added",
                count: doc.length,
                request: {
                    ttype: 'GET',
                    url: req.get('host')+'/api/depend/tracked'
                }
                
            })
        }

    }
    catch{
        res.status(200).json({
            "error" : "unable to process dependancies"
        });

    }
    
    
    
    
    
});


module.exports = router;