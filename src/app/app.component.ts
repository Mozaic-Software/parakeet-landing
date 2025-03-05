import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AppComponent {
  isScrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  title = 'Parakeet';

  workflowSteps = [
    {
      icon: '🎯',
      title: 'Define Your Workflow',
      description: 'Map out your process steps and requirements using our visual builder.'
    },
    {
      icon: '🔄',
      title: 'Configure Automation',
      description: 'Set up triggers, actions, and conditions without any coding.'
    },
    {
      icon: '🚀',
      title: 'Deploy & Monitor',
      description: 'Launch your workflow and track its performance in real-time.'
    }
  ];

  enterpriseFeatures = [
    {
      icon: '🔒',
      title: 'Advanced Security',
      description: 'Enterprise-grade encryption and security protocols.'
    },
    {
      icon: '📊',
      title: 'Custom Analytics',
      description: 'Detailed insights and custom reporting capabilities.'
    },
    {
      icon: '🤝',
      title: 'Dedicated Support',
      description: '24/7 priority support and implementation assistance.'
    }
  ];

  faqs = [
    {
      question: 'How does the no-code automation work?',
      answer: 'Our visual workflow builder lets you drag and drop components to create complex automations without writing any code.'
    },
    {
      question: 'What kind of support do you offer?',
      answer: 'We provide comprehensive documentation, email support, and dedicated account managers for enterprise customers.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use bank-level encryption and comply with industry security standards to protect your data.'
    }
  ];
}
