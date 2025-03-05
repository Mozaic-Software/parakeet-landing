import { Component } from '@angular/core';
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
  title = 'Parakeet';

  features = [
    {
      icon: '🟦',
      title: 'No-Code Workflow Builder',
      description: 'Create complex judicial workflows with our intuitive drag-and-drop interface. No coding required.'
    },
    {
      icon: '🔒',
      title: 'Secure Court Integrations',
      description: 'Seamlessly connect with your case management system and other judicial IT infrastructure.'
    },
    {
      icon: '⚡',
      title: 'Event-Driven Execution',
      description: 'Automate workflows that trigger based on case events, deadlines, or custom conditions.'
    },
    {
      icon: '✅',
      title: 'Approval & Review Steps',
      description: 'Built-in support for role-based approvals and multi-step review processes.'
    },
    {
      icon: '⚖️',
      title: 'Scalable & Reliable',
      description: 'Enterprise-grade performance that scales with your court\'s needs.'
    },
    {
      icon: '🔄',
      title: 'Custom Add-Ins',
      description: 'Extend functionality with custom integrations and workflow components.'
    }
  ];

  workflowSteps = [
    {
      icon: '1️⃣',
      title: 'Build Workflows',
      description: 'Design your automation workflows using our drag-and-drop interface.'
    },
    {
      icon: '2️⃣',
      title: 'Integrate Systems',
      description: 'Connect securely with your existing court management systems.'
    },
    {
      icon: '3️⃣',
      title: 'Execute & Monitor',
      description: 'Deploy workflows and track their execution in real-time.'
    }
  ];

  enterpriseFeatures = [
    {
      icon: '🔐',
      title: 'Security & Compliance',
      description: 'Microsoft Entra ID integration, role-based access control, and full audit logging.'
    },
    {
      icon: '📈',
      title: 'Scalability',
      description: 'Event-driven architecture that scales automatically with your needs.'
    },
    {
      icon: '🔌',
      title: 'Custom Add-Ins',
      description: 'Extend system functionality with custom integrations and components.'
    }
  ];

  faqs = [
    {
      question: 'When will Parakeet be available?',
      answer: 'Parakeet is currently in private beta with select courts. Join our waitlist to be notified when we launch publicly.'
    },
    {
      question: 'Which case management systems does Parakeet integrate with?',
      answer: 'Parakeet is designed to integrate with major court case management systems through secure APIs and custom connectors.'
    },
    {
      question: 'How secure is Parakeet for court data?',
      answer: 'Parakeet is built with enterprise-grade security, including Microsoft Entra ID integration, role-based access control, and end-to-end encryption.'
    },
    {
      question: 'What level of technical expertise is needed to use Parakeet?',
      answer: 'Parakeet is designed for non-technical users. Our no-code interface makes it easy to build and manage workflows without programming knowledge.'
    },
    {
      question: 'Can Parakeet be customized for our court?',
      answer: 'Yes, Parakeet can be customized to match your court\'s specific processes and requirements through our extensible platform.'
    }
  ];
}
