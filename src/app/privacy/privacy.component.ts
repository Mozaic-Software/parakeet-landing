import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-24">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-2xl shadow-sm p-8 sm:p-12">
          <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div class="prose prose-indigo max-w-none">
            <p class="text-lg text-gray-600 mb-8">
              Last updated: {{currentDate | date:'longDate'}}
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p class="text-gray-600 mb-4">
              At Parakeet, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our workflow automation platform.
            </p>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <p class="text-gray-600 mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul class="list-disc pl-6 mb-4 text-gray-600">
              <li>Account information (name, email, organization)</li>
              <li>Workflow configuration data</li>
              <li>Usage data and analytics</li>
              <li>Communication preferences</li>
            </ul>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p class="text-gray-600 mb-4">
              We use the collected information to:
            </p>
            <ul class="list-disc pl-6 mb-4 text-gray-600">
              <li>Provide and maintain our services</li>
              <li>Improve and personalize user experience</li>
              <li>Communicate with you about service updates</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p class="text-gray-600 mb-4">
              We implement appropriate technical and organizational security measures to protect your data, including:
            </p>
            <ul class="list-disc pl-6 mb-4 text-gray-600">
              <li>End-to-end encryption</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Secure data centers</li>
            </ul>

            <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Contact Us</h2>
            <p class="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy, please contact us at privacy&#64;parakeet.com
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PrivacyComponent {
  currentDate = new Date();
} 