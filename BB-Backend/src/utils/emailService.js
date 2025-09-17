const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Puedes cambiar esto según tu proveedor de correo
  auth: {
    type: "OAuth2",
    user: "diegov.penado@gmail.com",
    pass: "dvp17042006$$",
    clientId:
      "208739895515-frgb3s9qog72qg55432srun60cd547nn.apps.googleusercontent.com",
    clientSecret: "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",
    refreshToken:
      "1//04kLi3ACrbd6vCgYIARAAGAQSNwF-L9Ir798nzcK47u_TZ5B2S_J6P8ACvg3m9UZyGpRqIAfHsN4lFsJEm973Fip-a_fZ96U0EAg",
  },
});

exports.enviarCodigoVerificacion = async (email, codigo) => {
  const mailOptions = {
    from: "diegov.penado@gmail.com.com",
    to: email,
    subject: "Código de verificación",
    text: `Tu código de verificación es: ${codigo}`,
  };

  await transporter.sendMail(mailOptions);
};
