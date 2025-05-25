export const userActivationUrlEmailTemplate = ({ email, name, url }) => {
  return {
    from: `"Ecommerce website" <${process.env.SMTP_EMAIL}>`, //Sender address
    to: email, // List of recipients
    subject: "Action required : Activate your new account", // Subject line
    text: `Hello.. ${name},\n\nPlease activate your account by clicking the link below:\n${url}\n\nThank you!`, // Plain text body
    html: `<p>Hello ${name},</p>
        <p>Your account has been created. Please activate your account by clicking the link below:</p>
        <br>
        <br>
        <a href="${url}">
        <button style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none;">Activate Account</button>
        <br>
        <br>
        </a>
        <p>Thank you!</p>  
        <p>Regards</p>`, // HTML body
  };
};
export const userAccountActivatedNotificationTemplate = ({ email, name }) => {
  return {
    from: `"Ecommerce website" <${process.env.SMTP_EMAIL}>`, //Sender address
    to: email, // List of recipients
    subject: "Account activated", // Subject line
    text: `Hello.. ${name},\n\n, Your account has been activated. You may go and Sign in now.\n\nThank you!`, // Plain text body
    html: `<p>Hello ${name},</p>
       
        <br>
        <br>
        <p>Congratulations! Your account has been activated successfully.. You can login now.</p>
        <br>
        <br>
       
        <p>Thank you!</p>  
        <p>Regards</p>`, // HTML body
  };
};
