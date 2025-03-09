import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WaitlistEntry, WaitlistResponse } from '../models/waitlist.model';

@Injectable({
  providedIn: 'root'
})
export class WaitlistService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  submitWaitlistEntry(entry: WaitlistEntry): Observable<WaitlistResponse> {
    return this.http.post<WaitlistResponse>(`${this.API_URL}/api/waitlist`, {
      ...entry,
      submittedAt: new Date().toISOString()
    });
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