'use server';

import { VerifyLoginPayloadParams, createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "../../lib/thirdweb";
import { cookies } from 'next/headers';

const privateKey = process.env.AUTH_PRIVATE_KEY ? `0x${process.env.AUTH_PRIVATE_KEY}` : '';

const thirdwebAuth = createAuth({
  domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "",
  adminAccount: privateKeyToAccount({ client, privateKey }),
  client: client,
});

export async function isLoggedIn() {
  try {
    // Check if user has authentication cookie
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth_token');
    return !!authCookie;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}

export async function login(params: VerifyLoginPayloadParams) {
  try {
    // Verify the login payload
    const result = await thirdwebAuth.verifyPayload(params);
    
    if (result.valid) {
      // Create the user's account if needed
      await createUserAccount(result.payload.address);
      
      // Set auth cookie
      const cookieStore = await cookies();
      cookieStore.set('auth_token', result.payload.address, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }
    
    // Convert to a plain object to avoid issues with symbol properties
    return {
      valid: result.valid,
      payload: result.valid ? {
        address: result.payload.address,
        chainId: result.payload.chain_id,
        domain: result.payload.domain,
        expirationTime: result.payload.expiration_time,
        invalidBefore: result.payload.invalid_before,
        issuedAt: result.payload.issued_at,
        nonce: result.payload.nonce,
        statement: result.payload.statement,
        version: result.payload.version,
        uri: result.payload.uri
      } : null
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

async function createUserAccount(address: string) {
  // Here you would typically:
  // 1. Create a user record in your database
  // 2. Set up initial user preferences
  // 3. Initialize any necessary user data
  console.log('Creating new user account for:', address);
  
  // Add your account creation logic here
  // For example:
  // await db.users.create({
  //   address,
  //   createdAt: new Date(),
  //   preferences: defaultPreferences,
  // });
}

export async function generatePayload({ address, chainId }: { address: string; chainId: number }) {
  return await thirdwebAuth.generatePayload({
    address,
    chainId,
  });
}

export async function logout() {
  // Clear auth cookie
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  return true;
} 