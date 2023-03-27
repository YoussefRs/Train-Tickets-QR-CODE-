const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const dotenv = require('dotenv');

dotenv.config();


// @desc Register a new User
// @route  /api/users

const registerUser = asyncHandler( async (req,res) => {
    const { name, username, email, password } = req.body;

    //validation
    if (!name || !username || !email || !password) {
        res.status(400)
        throw new Error('Please include all fields')
    }

    //find if user exists
    const userExists = await User.findOne({ email })
    if (userExists) {
        res.status(400)
        throw new Error('User already exists')
    }

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create User
    const user = await User.create({
        name, username, email,
        password : hashedPassword
    })

    if(user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
            message : "user has been created"
        })
    } else {
        res.status(400)
        throw new Error('Invalid user data')
    }
})

//@desc    Login a user
//@route  /api/users/login

const loginUser = asyncHandler( async (req,res) => {
    const {email, password} = req.body;
    const user = await User.findOne({ email })

    //Check user and password match
    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    } else {
        //sends the error first
        res.status(401);
        // then throw the error to frontend
        throw new Error('Invalid credentials')
    }
})

//@desc  Get current User
// @route /api/user/me
// @access Private

const getMe = asyncHandler(async (req,res) => {
    const user = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        username: req.user.username
    }
    res.send(200).json(user)
})


const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, { expiresIn : "30d"})
}


module.exports = { registerUser, loginUser, getMe }