import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-24">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-2xl shadow-sm p-8 sm:p-12">
          <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Terms of Service</h1>
          
          <div class="prose prose-indigo max-w-none">
            <p class="text-lg text-gray-600 mb-8">
              Last updated: {{currentDate | date:'longDate'}}
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
            <p class="text-gray-600 mb-4">
              By accessing or using Parakeet's workflow automation platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use License</h2>
            <p class="text-gray-600 mb-4">
              Parakeet grants you a limited, non-exclusive, non-transferable license to use the platform for your organization's internal business purposes, subject to these Terms.
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Service Availability and Support</h2>
            <p class="text-gray-600 mb-4">
              We strive to maintain 99.9% uptime for our platform. Support is available during business hours, with priority support for enterprise customers.
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Ownership and Privacy</h2>
            <p class="text-gray-600 mb-4">
              You retain all rights to your data. We process and store data in accordance with our Privacy Policy and applicable regulations.
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Acceptable Use</h2>
            <p class="text-gray-600 mb-4">
              You agree not to:
            </p>
            <ul class="list-disc pl-6 mb-4 text-gray-600">
              <li>Use the platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Interfere with platform security</li>
              <li>Redistribute or resell the service</li>
            </ul>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Termination</h2>
            <p class="text-gray-600 mb-4">
              We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Contact</h2>
            <p class="text-gray-600 mb-4">
              For questions about these Terms, please contact us at legal&#64;parakeet.com
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TermsComponent {
  currentDate = new Date();
} 