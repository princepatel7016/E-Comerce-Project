import twilio from "twilio";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendOtp = async (phone) => {
    const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
            to: `+91${phone}`,
            channel: "sms"
        });

    return verification;
};

const verifyOtp = async (phone, otp) => {
    const verificationCheck = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
            to: `+91${phone}`,
            code: otp
        });

    return verificationCheck;
};

export { sendOtp, verifyOtp };