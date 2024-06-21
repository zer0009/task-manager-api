const express = require('express')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer  = require('multer')
const {sendWelcomeEmail} = require('../emails/account')



const router = new express.Router()

router.post('/users', async (req,res)=>{
    const user = new User(req.body)

    try{
        await user.save()
        sendWelcomeEmail(user.email,user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user,token })
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req,res)=>{

    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token })

    }catch(e){
        res.status(400).send()
    }

})

router.post('/users/logout', auth, async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()

    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()

    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me',auth, async (req,res)=>{
    res.send(req.user)

    // try{
    //   const users = await User.find({})
    //   res.send(users)
    // }catch(e){
    //     res.status(500).send()
    // }
})

router.get('/users/:id',async (req,res)=>{
    const _id = req.params.id
    try{
       const user = await User.findById(_id)
       if (!user){
        return res.status(404).send()
    }
    res.send(user)
    }catch(e){
        res.status(500).send()
    }
})

router.patch('/users/me',auth, async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'age', 'password']
    const isVaildOperation = updates.every((update)=> allowedUpdates.includes(update))

    if (!isVaildOperation){
        return res.status(400).send({'error': 'Invaild Update'})
    }
    try{
        // const user = await User.findById(req.params.id)
        updates.forEach((update)=> req.user[update] = req.body[update])
        await req.user.save()
        // const user = await User.findByIdAndUpdate(req.params.id, req.body,{new:true, runValidators:true})
        // if (!user){
        //     return res.status(404).send()
        // }
        res.send(req.user)

    }catch(e){
        res.status(500).send()
    }
})

// router.delete('/users/me',auth, async (req,res)=>{
//     try{       
//       await req.user.deleteOne()
//        res.send(req.user)
//     }catch(e){
//         res.status(500).send()
//     }
// })

// const upload = multer({
    
// })

const upload = multer({
    limits: {
        fileSize: 1000000 // Limit file size to 1MB
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error('please upload an image'))
        }
        cb(undefined,true)

    }
});

// router.post('/user/me/avatar',upload.single('avatar'), (req,res)=>{
//     res.send()
// })

router.post('/user/me/avatar',auth, upload.single('avatar'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({width:250,hight:250}).png().toBuffer()
        req.user.avatar = buffer
        await req.user.save()

        // Handle file upload and save file details to the user or another resource
        res.status(200).send({ message: 'File uploaded successfully' });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
},(error, req, res, next) => {
    res.status(400).send({ error: error.message });
});


router.delete('/user/me/avatar',auth, async (req, res) => {
        req.user.avatar = undefined
        await req.user.save()
        res.status(200).send({ message: 'File Deleted successfully' });
});


router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.deleteOne();
        res.status(200).send({ message: 'User and associated tasks deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).send({ error: 'Server error. Please try again later.' });
    }
});

router.get('/user/:id/avatar', async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar);

    }catch(e){
        res.status(404).send();
    }
})




module.exports = router
