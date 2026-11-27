import { verify } from 'otplib'

export interface Verify2faParams {
  token: string
  secret: string
}

export async function verify2fa(params: Verify2faParams) {
  const { token, secret } = params

  try {
    const { valid } = await verify({ token, secret })
    return valid
  } catch (error) {
    return false
  }
}
