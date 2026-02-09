import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JwtUtilService {
  
  /**
   * Decode a JWT token and extract the payload
   * @param token JWT token
   * @returns Decoded token payload or null if invalid
   */
  decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if a JWT token is expired
   * @param token JWT token
   * @returns true if token is expired, false otherwise
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return true;
      
      // exp is in seconds, convert to milliseconds
      const expirationTime = payload.exp * 1000;
      const currentTime = new Date().getTime();
      
      // Consider token expired if less than 1 minute remaining
      return currentTime >= expirationTime - 60000;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Get the remaining time until token expiration
   * @param token JWT token
   * @returns Remaining time in milliseconds, or -1 if expired
   */
  getTokenExpirationTime(token: string): number {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return -1;
      
      const expirationTime = payload.exp * 1000;
      const currentTime = new Date().getTime();
      const remainingTime = expirationTime - currentTime;
      
      return remainingTime > 0 ? remainingTime : -1;
    } catch (error) {
      console.error('Error getting token expiration time:', error);
      return -1;
    }
  }

  /**
   * Extract claims from a JWT token
   * @param token JWT token
   * @returns Token claims or null if invalid
   */
  getTokenClaims(token: string): any {
    return this.decodeToken(token);
  }

  /**
   * Validate JWT token structure
   * @param token JWT token
   * @returns true if token has valid structure, false otherwise
   */
  isValidTokenStructure(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
      for (const part of parts) {
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        atob(base64);
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
