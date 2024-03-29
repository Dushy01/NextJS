import nodemailer  from 'nodemailer';


const inviteEmail = (invitedUser, invitedUrl) => {
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
        from: 'agreharshit610gmail.com',
        to: invitedUser,
        subject: 'Invitation to join project',
        text: `You have been invited to join a project. Click on the link below to accept the invitation:\n\n${invitedUrl}`
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}
// inviteEmail("agreharshit610@gmail.com", "hi trying something new!")
export default inviteEmail;