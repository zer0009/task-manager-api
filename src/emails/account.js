
const formData = require('form-data');
const Mailgun = require('mailgun.js');


const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY});


const sendWelcomeEmail = (email, name)=>{
    mg.messages.create(process.env.DOMAIN, {
        from: 'egydark9@gmail.com',
        to: [email],
        subject: 'Thanks for Joining Us',
        text: `Welcome to the app ${name}!`,
      })
      .then(msg => console.log(msg)) // logs response data
      .catch(err => console.log(err)); // logs any error

}

module.exports = { sendWelcomeEmail }


