import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { WaitlistEntry, WaitlistResponse } from '../models/waitlist.model';

@Injectable({
  providedIn: 'root'
})
export class WaitlistService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('WaitlistService initialized with API URL:', this.apiUrl);
  }

  submitWaitlistEntry(entry: WaitlistEntry): Observable<WaitlistResponse> {
    const url = `${this.apiUrl}/waitlistfunction`;
    console.log('Submitting to URL:', url);
    console.log('Entry data:', JSON.stringify(entry));

    return this.http.post<WaitlistResponse>(url, entry, {
      headers: {
        'Content-Type': 'application/json'
      },
      observe: 'response'  // This will give us the full response including headers
    }).pipe(
      tap(response => {
        console.log('Full response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          body: response.body,
          url: response.url
        });
      }),
      map(response => response.body as WaitlistResponse),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('=== Error Details ===');
    console.error('Status:', error.status);
    console.error('Status Text:', error.statusText);
    console.error('URL:', error.url);
    console.error('Headers:', error.headers);
    
    if (error.status === 0) {
      console.error('Network Error or CORS issue');
      console.error('Error object:', error.error);
    } else {
      console.error('Backend Error Response:', {
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        message: error.message
      });

      // Try to parse error body if it's a string
      if (typeof error.error === 'string') {
        try {
          const parsedError = JSON.parse(error.error);
          console.error('Parsed Error Body:', parsedError);
        } catch (e) {
          console.error('Raw Error Body:', error.error);
        }
      }
    }

    // Log the full error object for debugging
    console.error('Full Error Object:', JSON.stringify(error, null, 2));

    return throwError(() => ({
      message: 'Something went wrong; please try again later.',
      details: error.message,
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      timestamp: new Date().toISOString()
    }));
  }

  // For development/testing purposes
  private mockSubmit(entry: WaitlistEntry): Observable<WaitlistResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        console.log('Waitlist entry received:', entry);
        observer.next({
          success: true,
          message: 'Successfully added to waitlist',
          data: {
            id: Math.random().toString(36).substring(7),
            email: entry.email
          }
        });
        observer.complete();
      }, 1000);
    });
  }
} 