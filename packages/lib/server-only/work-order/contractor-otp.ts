import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

/**
 * Generate a random OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via MSG91
 */
async function sendOTPViaMSG91(phone: string, otp: string): Promise<void> {
  const MSG91_API_KEY = process.env.MSG91_API_KEY;
  const MSG91_TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID;

  if (!MSG91_API_KEY) {
    throw new AppError(AppErrorCode.INVALID_BODY, {
      message: 'MSG91 API key not configured',
    });
  }

  try {
    const response = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: MSG91_API_KEY,
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        mobile: phone,
        otp,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MSG91 API error: ${error}`);
    }
  } catch (error) {
    console.error('Failed to send OTP via MSG91:', error);
    throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
      message: 'Failed to send OTP',
    });
  }
}

/**
 * Request OTP for contractor login
 */
export async function requestContractorOTP(phone: string): Promise<{ success: boolean }> {
  // Find contractor by phone
  const contractor = await prisma.contractor.findFirst({
    where: { phone },
  });

  if (!contractor) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Contractor not found',
    });
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Save OTP session
  await prisma.contractorOtpSession.create({
    data: {
      contractorId: contractor.id,
      otp,
      phone,
      expiresAt,
    },
  });

  // Send OTP via MSG91
  await sendOTPViaMSG91(phone, otp);

  return { success: true };
}

/**
 * Verify OTP for contractor login
 */
export async function verifyContractorOTP(
  phone: string,
  otp: string,
): Promise<{ contractorId: string; verified: boolean }> {
  // Find the most recent OTP session for this phone
  const otpSession = await prisma.contractorOtpSession.findFirst({
    where: {
      phone,
      otp,
      verified: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      contractor: true,
    },
  });

  if (!otpSession) {
    throw new AppError(AppErrorCode.UNAUTHORIZED, {
      message: 'Invalid or expired OTP',
    });
  }

  // Mark OTP as verified
  await prisma.contractorOtpSession.update({
    where: { id: otpSession.id },
    data: { verified: true },
  });

  return {
    contractorId: otpSession.contractorId,
    verified: true,
  };
}

/**
 * Clean up expired OTP sessions
 */
export async function cleanupExpiredOTPSessions(): Promise<void> {
  await prisma.contractorOtpSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
