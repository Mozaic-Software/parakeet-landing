import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { WaitlistService } from '../../services/waitlist.service';
import { WaitlistEntry } from '../../models/waitlist.model';

@Component({
  selector: 'app-waitlist-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-indigo-50">
        <!-- Badge -->
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div class="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Limited Time Early Access
          </div>
        </div>

        <div class="p-8">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Join the Waitlist</h2>
            <p class="mt-3 text-lg text-gray-600">Get early access to Parakeet and transform your court operations.</p>
          </div>
          
          <form *ngIf="!submitSuccess" [formGroup]="waitlistForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Work Email</label>
              <div class="mt-1">
                <input 
                  type="email" 
                  id="email"
                  formControlName="email"
                  class="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  [class.border-red-300]="waitlistForm.get('email')?.invalid && waitlistForm.get('email')?.touched"
                >
                <p *ngIf="waitlistForm.get('email')?.invalid && waitlistForm.get('email')?.touched" 
                   class="mt-1 text-sm text-red-600">
                  Please enter a valid work email address
                </p>
              </div>
            </div>

            <!-- Case Management System -->
            <div>
              <label for="caseManagementSystem" class="block text-sm font-medium text-gray-700">
                What case management system do you use?
              </label>
              <div class="mt-1">
                <select 
                  id="caseManagementSystem"
                  formControlName="caseManagementSystem"
                  class="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  (change)="onCmsChange($event)"
                >
                  <option value="">Select a system</option>
                  <option value="Enterprise Justice">Enterprise Justice</option>
                  <option value="eCourt">eCourt</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <!-- Other CMS Input -->
              <div *ngIf="showOtherCms" class="mt-3">
                <label for="otherCms" class="block text-sm font-medium text-gray-700">Please specify</label>
                <input 
                  type="text"
                  id="otherCms"
                  formControlName="otherCms"
                  class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
            </div>

            <!-- Agency Type -->
            <div>
              <label for="agencyType" class="block text-sm font-medium text-gray-700">
                What type of agency are you representing?
              </label>
              <div class="mt-1">
                <select 
                  id="agencyType"
                  formControlName="agencyType"
                  class="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  (change)="onAgencyChange($event)"
                >
                  <option value="">Select an agency type</option>
                  <option value="Superior Court">Superior Court</option>
                  <option value="Appellate Court">Appellate Court</option>
                  <option value="District Court">District Court</option>
                  <option value="Municipal Court">Municipal Court</option>
                  <option value="Probation">Probation</option>
                  <option value="District Attorney">District Attorney</option>
                  <option value="Private Attorney">Private Attorney</option>
                  <option value="Public Defender">Public Defender</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <!-- Other Agency Input -->
              <div *ngIf="showOtherAgency" class="mt-3">
                <label for="otherAgency" class="block text-sm font-medium text-gray-700">Please specify</label>
                <input 
                  type="text"
                  id="otherAgency"
                  formControlName="otherAgency"
                  class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-4">
              <button 
                type="submit"
                [disabled]="waitlistForm.invalid || isSubmitting"
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span *ngIf="!isSubmitting" class="flex items-center">
                  Join Waitlist
                  <svg class="w-5 h-5 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <span *ngIf="isSubmitting" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              </button>
            </div>
          </form>

          <!-- Success Message -->
          <div *ngIf="submitSuccess" class="text-center py-12">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-2">Registration successful!</h3>
            <p class="text-sm text-gray-500">
              Thanks for joining our waitlist! We'll be in touch soon with next steps.
            </p>
            <button 
              (click)="waitlistForm.reset(); submitSuccess = false"
              class="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register another
            </button>
          </div>

          <!-- Error Message -->
          <div *ngIf="submitError" 
               class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Submission failed</h3>
                <p class="mt-2 text-sm text-red-700">{{submitError}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WaitlistFormComponent {
  waitlistForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;
  showOtherCms = false;
  showOtherAgency = false;

  constructor(
    private fb: FormBuilder,
    private waitlistService: WaitlistService
  ) {
    this.waitlistForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      caseManagementSystem: ['', Validators.required],
      otherCms: [''],
      agencyType: ['', Validators.required],
      otherAgency: ['']
    });
  }

  onCmsChange(event: any) {
    const value = event.target.value;
    this.showOtherCms = value === 'other';
    if (this.showOtherCms) {
      this.waitlistForm.get('otherCms')?.setValidators(Validators.required);
    } else {
      this.waitlistForm.get('otherCms')?.clearValidators();
      this.waitlistForm.get('otherCms')?.setValue('');
    }
    this.waitlistForm.get('otherCms')?.updateValueAndValidity();
  }

  onAgencyChange(event: any) {
    const value = event.target.value;
    this.showOtherAgency = value === 'other';
    if (this.showOtherAgency) {
      this.waitlistForm.get('otherAgency')?.setValidators(Validators.required);
    } else {
      this.waitlistForm.get('otherAgency')?.clearValidators();
      this.waitlistForm.get('otherAgency')?.setValue('');
    }
    this.waitlistForm.get('otherAgency')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.waitlistForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = null;

      const formData = this.waitlistForm.value;
      const entry: WaitlistEntry = {
        email: formData.email,
        caseManagementSystem: formData.caseManagementSystem === 'other' ? formData.otherCms : formData.caseManagementSystem,
        agencyType: formData.agencyType === 'other' ? formData.otherAgency : formData.agencyType,
        submittedAt: new Date().toISOString()
      };

      if (formData.caseManagementSystem === 'other') {
        entry.otherCms = formData.otherCms;
      }

      if (formData.agencyType === 'other') {
        entry.otherAgency = formData.otherAgency;
      }

      this.waitlistService.submitWaitlistEntry(entry).subscribe({
        next: (response) => {
          this.submitSuccess = true;
          this.isSubmitting = false;
          this.waitlistForm.reset();
        },
        error: (error) => {
          this.submitError = 'There was an error submitting your request. Please try again.';
          this.isSubmitting = false;
          console.error('Submission error:', error);
        }
      });
    }
  }
} 