import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface WorkflowData {
  eventId?: string;
  eventType?: string;
  timestamp?: string;
  documentId?: string;
  documentUrl?: string;
  documentType?: string;
  linkedDocuments?: Array<{
    id: string;
    url: string;
    type: string;
    linkType: string;
  }>;
  metadata?: Record<string, any>;
}

interface StepStatus {
  isActive: boolean;
  isCompleted: boolean;
  isAnimatingFlow: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule]
})
export class AppComponent {
  isScrolled = false;
  isSimulating = false;
  currentSimulationStep = -1;
  consoleOutput: string[] = [];
  workflowData: WorkflowData = {};

  stepStatuses: StepStatus[] = [];

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  title = 'Parakeet';

  // Workflow nodes
  availableNodes = [
    {
      id: 'add-event',
      type: 'primary',
      icon: `<svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      label: 'Add Event',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      processData: (data: WorkflowData): WorkflowData => {
        const eventId = `evt_${Math.random().toString(36).substr(2, 9)}`;
        return {
          ...data,
          eventId,
          eventType: 'DOCUMENT_PROCESSING',
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'automated_workflow',
            priority: 'high'
          }
        };
      },
      getDescription: (data: WorkflowData) => ({
        start: "Starting event processing...",
        details: [
          "Initializing event",
          "Processing metadata",
          "Finalizing event"
        ],
        result: "Event processing complete"
      })
    },
    {
      id: 'add-document',
      type: 'secondary',
      icon: `<svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24">
        <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      label: 'Add Document',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      processData: (data: WorkflowData): WorkflowData => {
        const documentId = `doc_${Math.random().toString(36).substr(2, 9)}`;
        return {
          ...data,
          documentId,
          documentUrl: `https://storage.parakeet.com/documents/${data.eventId}/${documentId}.pdf`,
          documentType: 'application/pdf',
          metadata: {
            ...data.metadata,
            fileSize: '2.4MB',
            pageCount: 12,
            uploadedAt: new Date().toISOString()
          }
        };
      },
      getDescription: (data: WorkflowData) => ({
        start: "Processing document...",
        details: [
          "Analyzing document",
          "Extracting data",
          "Storing document"
        ],
        result: "Document processing complete"
      })
    },
    {
      id: 'add-link-document',
      type: 'secondary',
      icon: `<svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24">
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      label: 'Add and Link Document',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      processData: (data: WorkflowData): WorkflowData => {
        const newDoc = {
          id: `doc_${Math.random().toString(36).substr(2, 9)}`,
          url: `https://storage.parakeet.com/documents/${data.eventId}/${Math.random().toString(36).substr(2, 9)}.pdf`,
          type: 'supporting_evidence',
          linkType: 'reference'
        };
        return {
          ...data,
          linkedDocuments: [...(data.linkedDocuments || []), newDoc],
          metadata: {
            ...data.metadata,
            lastLinkedAt: new Date().toISOString(),
            totalLinkedDocs: (data.linkedDocuments?.length || 0) + 1
          }
        };
      },
      getDescription: (data: WorkflowData) => ({
        start: "Linking documents...",
        details: [
          "Creating connection",
          "Updating references",
          "Validating links"
        ],
        result: "Document linking complete"
      })
    }
  ];

  workflowNodes: any[] = [];

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const itemToDrop = event.previousContainer.data[event.previousIndex];
      
      // Check if the workflow follows the correct progression
      if (this.canAddNode(itemToDrop)) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      }
    }
  }

  canAddNode(node: any): boolean {
    // If it's the first node, it must be "Add Event"
    if (this.workflowNodes.length === 0) {
      return node.id === 'add-event';
    }
    
    // If "Add Event" is not the first node, prevent adding
    if (node.id === 'add-event' && this.workflowNodes.length > 0) {
      return false;
    }

    // After "Add Event", only allow "Add Document" or "Add and Link Document"
    if (this.workflowNodes[0].id === 'add-event') {
      return ['add-document', 'add-link-document'].includes(node.id);
    }

    return false;
  }

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

  formatDataOutput(data: any): string {
    return JSON.stringify(data, null, 2)
      .split('\n')
      .map(line => '  ' + line)
      .join('\n');
  }

  initializeStepStatuses() {
    this.stepStatuses = this.workflowNodes.map(() => ({
      isActive: false,
      isCompleted: false,
      isAnimatingFlow: false
    }));
  }

  async simulateWorkflow() {
    if (this.isSimulating || this.workflowNodes.length === 0) return;
    
    this.isSimulating = true;
    this.currentSimulationStep = -1;
    this.consoleOutput = [];
    this.workflowData = {};
    this.initializeStepStatuses();
    
    this.consoleOutput.push("▶️ Starting workflow execution");
    await this.scrollConsole();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (let i = 0; i < this.workflowNodes.length; i++) {
      this.currentSimulationStep = i;
      this.stepStatuses[i].isActive = true;
      
      const node = this.workflowNodes[i];
      const description = node.getDescription(this.workflowData);
      
      this.consoleOutput.push(`\n⚡ ${description.start}`);
      await this.scrollConsole();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Process data first
      this.workflowData = node.processData(this.workflowData);
      
      // Show progress for each detail
      for (const detail of description.details) {
        this.consoleOutput.push(`  ${detail}...`);
        await this.scrollConsole();
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Update the last line to show progress
        this.consoleOutput[this.consoleOutput.length - 1] = `  ${detail}... done`;
        await this.scrollConsole();
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      this.stepStatuses[i].isActive = false;
      this.stepStatuses[i].isCompleted = true;
      this.consoleOutput.push(`✅ ${description.result}`);
      await this.scrollConsole();
      
      if (i < this.workflowNodes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
        this.consoleOutput.push(`\n➡️ Moving to next step`);
        await this.scrollConsole();
        this.stepStatuses[i].isAnimatingFlow = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.stepStatuses[i].isAnimatingFlow = false;
      }
    }
    
    this.currentSimulationStep = -1;
    this.isSimulating = false;
    
    await new Promise(resolve => setTimeout(resolve, 800));
    this.consoleOutput.push("\n✨ Workflow execution completed");
    await this.scrollConsole();
  }

  // Helper method to scroll console to bottom
  private async scrollConsole() {
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to ensure DOM update
    const consoleElement = document.querySelector('.console-output');
    if (consoleElement) {
      consoleElement.scrollTop = consoleElement.scrollHeight;
    }
  }

  isNodeActive(index: number): boolean {
    return this.stepStatuses[index]?.isActive || false;
  }

  isNodeCompleted(index: number): boolean {
    return this.stepStatuses[index]?.isCompleted || false;
  }

  isFlowAnimating(index: number): boolean {
    return this.stepStatuses[index]?.isAnimatingFlow || false;
  }
}
