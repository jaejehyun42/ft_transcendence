const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// OTP 시크릿 생성 및 QR 코드 생성 함수
async function generateOTP() {
  const secret = speakeasy.generateSecret({ name: 'ft_transcendence' });
  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);
  return { secret, qrCodeDataUrl };
}

// OTP 검증 함수
function verifyOTP(token, secret) {
  return speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: token,
    window: 1
  });
}

module.exports = { generateOTP, verifyOTP };