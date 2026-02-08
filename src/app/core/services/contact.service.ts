import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Contact } from '../models/contact.model';
import { LoggerService } from '../../shared/services/logger.service';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = '/api/contacts';

  constructor(private http: HttpClient, private logger: LoggerService) {}

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl).pipe(
      tap(() => this.logger.logInfo('Contacts loaded')),
      catchError(this.handleError)
    );
  }

  getContact(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.logger.logInfo(`Contact ${id} loaded`)),
      catchError(this.handleError)
    );
  }

  createContact(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact).pipe(
      tap(() => this.logger.logInfo('Contact created')),
      catchError(this.handleError)
    );
  }

  updateContact(contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl}/${contact.id}`, contact).pipe(
      tap(() => this.logger.logInfo(`Contact ${contact.id} updated`)),
      catchError(this.handleError)
    );
  }

  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.logger.logInfo(`Contact ${id} deleted`)),
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong'));
  }
}
