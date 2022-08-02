const express = require("express")
const bcrypt = require("bcrypt")
const db = require("../db/database.js")
const router = express.Router()

router.post("/", (request, response) => {
    //check if user trade of builder
    let sqlEmail = `
        SELECT email FROM users 
    `
    let sql = `
        INSERT INTO users (name, email, phone_number, role, password_hash) VALUES ($1, $2, $3, $4, $5)
    `

    //recieves form data from frontend
    const name = request.body.name
    const email = request.body.email
    const phoneNumber = request.body.phoneNumber
    const role = request.body.role
    const password = request.body.password
    const checkPassword = request.body.checkPassword

    // const checkPassWordCharacters = /^[a-zA-Z0-9~_&*%@$]+$/

    //creates the hashed password to store
    const generateHash = (password) => {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
    }

    //Sends an error message if missing fields
    if (!name || !email || !password || !checkPassword) {
        response.status(400)
        response.json({ success: false, message: "Please complete all fields" })
        return
    }

    //check database to check if email already used
    //then checks all fields are correctly filled in

    db.query(sqlEmail).then((dbResponse) => {
        for (const dbEmail of dbResponse.rows) {
            if (email === dbEmail.email) {
                response.status(400)
                response.json({
                    success: false,
                    message: "Email already used",
                })
                return
            }
        }
        if (password !== checkPassword) {
            response.status(400)
            response.json({
                success: false,
                message: "Your passwords do not match",
            })
            return
        } else if (password.length < 8 || password.length > 16) {
            response.status(400)
            response.json({
                success: false,
                message: "Your password should be 8 - 16 characters in length.",
            })
            return
            // } else if (checkPassWordCharacters.test(password)){
            //     response.status(400)
            //     response.json({
            //         success: false,
            //         message: "Your password needs to include an uppercase letter, number and symbol"
            //     })
            //     return
        } else {
            //adds user to database if successful
            const password_hash = generateHash(password)

            db.query(sql, [name, email, phoneNumber, role, password_hash])
                .then((dbResponse) => {
                    response.json({ success: true })
                })
                .catch((reason) => {
                    response.status(500).json({
                        success: false,
                        message: "Unknown server error",
                        error: reason,
                    })
                })
        }
    })
})

//get users with role of trade
router.get("/trades", (req, res) => {
    const user_id = req.session.userId
    const sql = `
        SELECT name, email, phone_number, user_id FROM users WHERE role = 'trade' AND user_id <> $1
    `

    db.query(sql, [user_id])
        .then((dbResponse) => {
            res.status(200)
            res.json(dbResponse.rows)
        })
        .catch((error) => {
            res.status(500)
            res.json(error)
        })
})

//get users with role of builder
router.get("/builders", (req, res) => {
    const user_id = req.session.userId

    const sql = `
        SELECT name, email, phone_number, user_id FROM users WHERE role = 'builder' AND user_id <> $1
    `

    db.query(sql, [user_id])
        .then((dbResponse) => {
            res.status(200)
            res.json(dbResponse.rows)
        })
        .catch((error) => {
            res.status(500)
            res.json(error)
        })
})

module.exports = router
