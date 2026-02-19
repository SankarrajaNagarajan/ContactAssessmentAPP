import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class JwtUtilService {
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
  
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return true;
      
     
      const expirationTime = payload.exp * 1000;
      const currentTime = new Date().getTime();
      
     
      return currentTime >= expirationTime - 60000;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
  
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
  
  getTokenClaims(token: string): any {
    return this.decodeToken(token);
  }
  
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
