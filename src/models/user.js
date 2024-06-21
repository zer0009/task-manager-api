const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Tasks = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        trim:true,
        lowercase: true,
        validate: {
            validator(value){
                if (!validator.isEmail(value)){
                    throw new Error ('Invaild Email')
                }
            }
        }

    },
    password:{
        type: String,
        required: true,
        trim:true,
        minLength: 7,
        validate: {
            validator(value){
                if (value.includes("password")){
                    throw new Error ('Your Password must not contain (Password) text')
                }
                if (value.length < 6){
                    throw new Error ('Your Password must be greater than 6')
                }
            }
        }

    },
    age :{
        type:Number,
        default: 0,
        validate: {
            validator(value) {
            if (value < 0){
                throw new Error ('Age Must be postive number')
            }
        }
    }
    },
    tokens:[{
        token:{
            type:String,
            required: true
        }
    }],
    avatar:{
        type:Buffer
    }

},{
    timestamps:true
})

userSchema.virtual('tasks',{
    ref:'Tasks',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function (){
    const user = this
    const token = jwt.sign({_id : user._id.toString()}, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email,password)=>{
    const user = await User.findOne({ email })
    if (!user) {
    throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
    throw new Error('Unable to login')
    }
    return user

}

// Hash plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this
    // console.log(user._id)
    if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
    }
    next()
   })

//  Delete user Task if user is removed
userSchema.pre('deleteOne', async function(next) {
    const user = this;
    console.log(user._conditions._id)
    try {
        await Tasks.deleteMany({ owner: user._conditions._id });
        next();
    } catch (e) {
        next(e);
    }
});

const User = mongoose.model('User', userSchema);





module.exports = User