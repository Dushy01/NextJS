// const nodemailer  = require('nodemailer');


// const inviteEmail = (invitedUser, invitedUrl) => {
//     // Create a transporter object with your email service credentials
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: 'agreharshit610@gmail.com',
//             pass: 'nzgj amef lhwx jcgt'
//         }
//     });

//     // Define the email content
//     const mailOptions = {
//         from: 'agreharshit610gmail.com',
//         to: invitedUser,
//         subject: 'Invitation to join project',
//         text: `You have been invited to join a project. Click on the link below to accept the invitation:\n\n${invitedUrl}`
//     };

//     // Send the email
//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.error('Error sending email:', error);
//             return false;
//         } else {
//             console.log('Email sent:', info.response);
//             return true;
//         }
//     });
// }




// const express = require('express');
// const cors = require('cors');
// // Create an Express application
// const app = express();
// app.use(cors());
// // Middleware to parse JSON request bodies
// app.use(express.json());
// app.post('/sendInvite', (req, res) => {
//     const {inviteTo, UniqueUrl} = req.body;
//     console.log(inviteTo, UniqueUrl);

//     const response = inviteEmail(inviteTo, UniqueUrl);
//     if (response) {
//         res.status(200);
//     }
//     else {
//         res.status(400);
//     }
// });

// // Start the server and listen on port 5000
// app.listen(5000, () => {
//   console.log('Server is running on port 5000');
// });



// // import mailgun from "mailgun-js";


// // const inviteViaEmail = (url) => {
// //     const DOMAIN = "sandbox99b2efb40c86476f9147da497070a2ff.mailgun.org";
// //     const mg = mailgun({ apiKey: "ad8a488ee07e8f4a25b869a8d7727990-f68a26c9-2e0f8986", domain: DOMAIN });

// //     const data = {
// //         from: "Mailgun Sandbox <postmaster@sandbox99b2efb40c86476f9147da497070a2ff.mailgun.org>",
// //         to: "agreharshit610@gmail.com",
// //         subject: "Hello",
// //         text: `You have been invited to join a project. Click on the link below to accept the invitation:\n\n${url}`
// //     };
// //     mg.messages().send(data, function (error, body) {
// //         console.log(body);
// //     });
// // }

// // export default inviteViaEmail;



const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

// Create an Express application
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Enable CORS
app.use(cors());

// Define the inviteEmail function with a callback parameter
const inviteEmail = (invitedUser, invitedUrl, callback) => {
    // Create a transporter object with your email service credentials
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'agreharshit610@gmail.com',
            pass: 'nzgj amef lhwx jcgt'
        }
    });

    // Define the email content
    const mailOptions = {
        from: 'agreharshit610@gmail.com',
        to: invitedUser,
        subject: 'Invitation to join project',
        text: `You have been invited to join a project. Click on the link below to accept the invitation:\n\n${invitedUrl}`
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            // Call the callback with false if there's an error
            callback(false);
        } else {
            console.log('Email sent:', info.response);
            // Call the callback with true if the email is sent successfully
            callback(true);
        }
    });
};

// Define the route to handle sending invitations
app.post('/sendInvite', (req, res) => {
    const { inviteTo, UniqueUrl } = req.body;

    console.log(inviteTo, UniqueUrl);

    // Call the inviteEmail function with a callback
    inviteEmail(inviteTo, UniqueUrl, (response) => {
        console.log('response from the invite email', response);
        if (response) {
            res.status(200).send('Invitation sent successfully');
        } else {
            res.status(500).send('Failed to send invitation');
        }
    });
});


// Start the server and listen on port 5000
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
