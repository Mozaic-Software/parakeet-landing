import { Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDrag, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { WorkflowService, WorkflowData } from './services/workflow.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  
  transform(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

interface StepStatus {
  isActive: boolean;
  isCompleted: boolean;
  isAnimatingFlow: boolean;
}

interface WorkflowNode {
  id: string;
  label: string;
  icon: string;
  iconClass: string;
  badgeClass: string;
  source: string;
  instanceId: string;
  processData: (data: WorkflowData) => WorkflowData;
}

interface ConsoleOutput {
  type: 'success' | 'error' | 'info' | 'status';
  text: string;
}

interface FaqItem {
  question: string;
  answer: string;
  isOpen?: boolean;
}

interface FaqCategory {
  title: string;
  icon: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, SafeHtmlPipe]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('workflowCanvas') workflowCanvas!: ElementRef;
  
  isScrolled = false;
  isSimulating = false;
  currentSimulationStep = -1;
  consoleOutput: ConsoleOutput[] = [];
  workflowData: WorkflowData;
  stepStatuses: StepStatus[] = [];
  workflowNodes: WorkflowNode[] = [];
  searchQuery: string = '';
  currentYear = new Date().getFullYear();

  // Panning state
  isPanning = false;
  panStart = { x: 0, y: 0 };
  panPosition = { x: 0, y: 0 };
  lastPanPosition = { x: 0, y: 0 };
  zoomLevel = 1;
  readonly ZOOM_STEP = 0.1;
  readonly MIN_ZOOM = 0.5;
  readonly MAX_ZOOM = 2;

  // Add this near the top of the class with other properties
  sortPredicate = (index: number, item: CdkDrag<WorkflowNode>) => {
    return index > 0; // Prevent dropping at index 0
  };

  currentHighlightedStep = 0;
  private animationInterval: any;
  private readonly STEP_DURATION = 3000; // 3 seconds per step

  faqSearchQuery: string = '';

  constructor(private workflowService: WorkflowService) {
    this.workflowData = this.workflowService.getInitialWorkflowData();
    // Initialize with static start node
    const startNode: WorkflowNode = {
      id: 'start',
      label: 'Start',
      icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
      iconClass: 'text-indigo-600',
      badgeClass: 'bg-indigo-100 text-indigo-700',
      source: 'System',
      instanceId: 'node_1',
      processData: (data: WorkflowData) => data
    };
    this.workflowNodes = [startNode];
    this.initializeStepStatuses();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  title = 'Parakeet';

  // Updated workflow nodes with proper categorization
  availableNodes: WorkflowNode[] = [
    {
      id: 'add_event',
      label: 'Add Event',
      icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>',
      iconClass: 'text-indigo-600',
      badgeClass: 'bg-indigo-50 text-indigo-700',
      source: 'Enterprise Justice™',
      instanceId: 'template_add_event',
      processData: (data: WorkflowData) => ({
        ...data,
        metadata: {
          ...data.metadata,
          lastEvent: {
            type: 'CASE_UPDATE',
            timestamp: new Date().toISOString()
          }
        }
      })
    },
    {
      id: 'add_document',
      label: 'Add Document',
      icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
      iconClass: 'text-indigo-600',
      badgeClass: 'bg-indigo-50 text-indigo-700',
      source: 'ECourt™',
      instanceId: 'template_add_document',
      processData: (data: WorkflowData) => ({
        ...data,
        documents: [
          ...(data.documents || []),
          {
            id: `DOC-${Math.random().toString(36).substr(2, 9)}`,
            type: 'FILING',
            url: `https://court.gov/docs/${data.caseId}/latest.pdf`,
            status: 'PENDING_REVIEW'
          }
        ]
      })
    },
    {
      id: 'update_charge',
      label: 'Update Charge',
      icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>',
      iconClass: 'text-indigo-600',
      badgeClass: 'bg-indigo-50 text-indigo-700',
      source: 'Enterprise Justice™',
      instanceId: 'template_update_charge',
      processData: (data: WorkflowData) => ({
        ...data,
        charges: data.charges.map(charge => ({
          ...charge,
          status: 'UPDATED',
          lastModified: new Date().toISOString()
        }))
      })
    },
    {
      id: 'send_email',
      label: 'Send Email',
      icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>',
      iconClass: 'text-indigo-600',
      badgeClass: 'bg-indigo-50 text-indigo-700',
      source: 'CourtComm™',
      instanceId: 'template_send_email',
      processData: (data: WorkflowData) => ({
        ...data,
        metadata: {
          ...data.metadata,
          lastNotification: {
            type: 'EMAIL',
            timestamp: new Date().toISOString(),
            recipients: data.parties.map(p => p.email)
          }
        }
      })
    }
  ];

  // Filter nodes by type and search query
  getFilteredNodesByType(type: string): WorkflowNode[] {
    return this.availableNodes.filter(node => {
      const matchesType = node.source === type;
      const matchesSearch = !this.searchQuery || 
        node.label.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        node.source.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }

  onDrop(event: CdkDragDrop<WorkflowNode[]>) {
    if (!event.isPointerOverContainer) {
      return;
    }

    if (event.previousContainer === event.container) {
      // Reordering within workflow
      if (event.previousIndex === 0 || event.currentIndex === 0) {
        return; // Prevent moving Start node or moving items to position 0
      }

      // Get the actual target index, accounting for the Start node
      const targetIndex = Math.max(1, event.currentIndex);
      const sourceIndex = event.previousIndex;

      // Move the item
      const nodeToMove = this.workflowNodes[sourceIndex];
      this.workflowNodes.splice(sourceIndex, 1);
      this.workflowNodes.splice(targetIndex, 0, nodeToMove);
    } else {
      // Adding new node from components panel
      const nodeData = event.item.data;
      const insertIndex = Math.max(1, event.currentIndex); // Ensure we never insert at 0
      
      const newNode: WorkflowNode = {
        ...nodeData,
        instanceId: `step_${this.workflowNodes.length}`
      };

      this.workflowNodes.splice(insertIndex, 0, newNode);
    }

    // Update IDs and status
    this.updateNodeIds();
    this.initializeStepStatuses();
    
    // Reset search
    this.searchQuery = '';
  }

  private updateNodeIds() {
    // Keep Start node as is
    const startNode = this.workflowNodes[0];
    
    // Update remaining nodes
    for (let i = 1; i < this.workflowNodes.length; i++) {
      this.workflowNodes[i].instanceId = `step_${i}`;
    }
  }

  // Helper method to update view
  private updateView() {
    setTimeout(() => {
      const canvas = document.querySelector('.workflow-list');
      if (canvas) {
        canvas.scrollTo({
          top: canvas.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 0);
  }

  workflowSteps = [
    {
      icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7v10c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4V7c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      iconClass: 'inline-flex items-center justify-center p-4 bg-blue-50 rounded-xl text-blue-600 mb-5',
      title: '1. Define your data',
      description: 'Map out your data structure and requirements for your workflow.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
      </svg>`,
      iconClass: 'inline-flex items-center justify-center p-4 bg-purple-50 rounded-xl text-purple-600 mb-5',
      title: '2. Create a workflow',
      description: 'Design your automation flow using our intuitive drag-and-drop builder.'
    },
    {
      icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M9 12h6m-6 4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      iconClass: 'inline-flex items-center justify-center p-4 bg-teal-50 rounded-xl text-teal-600 mb-5',
      title: '3. Generate a List',
      description: 'Create and manage task lists for your workflow processes.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
      </svg>`,
      iconClass: 'inline-flex items-center justify-center p-4 bg-indigo-50 rounded-xl text-indigo-600 mb-5',
      title: '4. Execute and Monitor',
      description: 'Run your workflows and track their performance in real-time.'
    }
  ];

  enterpriseFeatures = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>`,
      iconClass: 'inline-flex items-center justify-center p-4 bg-blue-50 rounded-xl text-blue-600 mb-5',
      title: 'Enterprise-Grade Security',
      description: 'Full compliance with CJIS, state regulations, and role-based access control to protect sensitive legal data.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>`,
      iconClass: 'inline-flex items-center justify-center p-4 bg-purple-50 rounded-xl text-purple-600 mb-5',
      title: 'Workflow Marketplace',
      description: 'Save time with preconfigured case automation templates—customize them to fit your agency\'s unique needs.'
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>`,
      iconClass: 'inline-flex items-center justify-center p-4 bg-teal-50 rounded-xl text-teal-600 mb-5',
      title: 'Justice Partner Collaboration',
      description: 'Securely exchange case data between courts, DA offices, and justice agencies. Upload lists, map schemas, and trigger workflows—keeping all stakeholders aligned in real time.'
    }
  ];

  faqCategories: FaqCategory[] = [
    {
      title: 'General Questions',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />',
      items: [
        {
          question: 'What is Parakeet Workflow Automation?',
          answer: "Parakeet is a no-code workflow automation platform designed to help courts, justice administration, and clerks streamline case management, approvals, and inter-agency workflows—without requiring IT support."
        },
        {
          question: 'Who can use Parakeet?',
          answer: "Parakeet is built for courts (State, County, and Municipal), justice administration offices, court clerks, case processing teams, and other judicial stakeholders & justice partners."
        }
      ]
    },
    {
      title: 'Features & Functionality',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />',
      items: [
        {
          question: 'What are the key features of Parakeet?',
          answer: "Parakeet offers a no-code workflow builder, real-time automation, case management integration, secure document handling, and comprehensive audit trails."
        },
        {
          question: 'Can I customize workflows for my specific needs?',
          answer: "Yes, Parakeet provides a flexible drag-and-drop interface that allows you to create custom workflows tailored to your court's specific processes and requirements."
        }
      ]
    },
    {
      title: 'Integrations & Compatibility',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />',
      items: [
        {
          question: 'Which case management systems does Parakeet integrate with?',
          answer: "Parakeet integrates with major case management systems and provides flexible APIs for custom integrations with your existing tools and databases."
        },
        {
          question: 'Is it compatible with our existing document management system?',
          answer: "Yes, Parakeet is designed to work seamlessly with popular document management systems and can be configured to support your specific document handling requirements."
        }
      ]
    },
    {
      title: 'Security & Compliance',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />',
      items: [
        {
          question: 'How does Parakeet ensure data security?',
          answer: "Parakeet employs enterprise-grade security measures including end-to-end encryption, role-based access control, and regular security audits to protect sensitive court data."
        },
        {
          question: 'Does Parakeet comply with judicial data regulations?',
          answer: "Yes, Parakeet is built to comply with relevant judicial data handling regulations and can be configured to meet specific compliance requirements."
        }
      ]
    },
    {
      title: 'Support & Training',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />',
      items: [
        {
          question: 'What kind of support is available?',
          answer: "We provide comprehensive support including dedicated customer success managers, technical support, and regular check-ins to ensure your success."
        },
        {
          question: 'Is training provided for new users?',
          answer: "Yes, we offer thorough onboarding training, ongoing education sessions, and a comprehensive knowledge base to help your team succeed."
        }
      ]
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

  ngAfterViewInit() {
    // Initial setup
  }

  private scrollToActiveNode() {
    setTimeout(() => {
      const activeNode = this.workflowCanvas.nativeElement.querySelector('.workflow-node.active');
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  private resetWorkflow() {
    // Keep only the start node
    const startNode = this.workflowNodes[0];
    this.workflowNodes = [startNode];
    this.initializeStepStatuses();
    this.consoleOutput = [];
    this.centerView();
  }

  async simulateWorkflow() {
    this.isSimulating = true;
    this.consoleOutput = []; // Clear previous output
    const totalNodes = this.workflowNodes.length;

    // Add initial console output
    this.addConsoleOutput('🚀 Starting workflow simulation...', 'info');
    this.addConsoleOutput('📋 Preparing execution plan...', 'status');

    for (let i = 0; i < totalNodes; i++) {
      this.currentSimulationStep = i;
      const node = this.workflowNodes[i];
      const stepNumber = i === 0 ? 'Start' : i;
      
      // Update step status
      this.stepStatuses[i] = {
        isActive: true,
        isCompleted: false,
        isAnimatingFlow: false
      };

      // Add console output for current step
      this.addConsoleOutput(`⚡ Executing Step ${stepNumber}: ${node.label}`, 'status');
      this.addConsoleOutput(`   ⏳ Processing...`, 'info');
      
      // Scroll to active node
      this.scrollToActiveNode();
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update step status to completed
      this.stepStatuses[i] = {
        isActive: false,
        isCompleted: true,
        isAnimatingFlow: i < totalNodes - 1
      };

      // Add completion message
      this.addConsoleOutput(`   ✅ Step ${stepNumber} completed successfully!`, 'success');
      
      if (i < totalNodes - 1) {
        this.addConsoleOutput(`   ⏭️  Moving to next step...`, 'info');
      }
    }

    this.isSimulating = false;
    this.currentSimulationStep = -1;
    this.addConsoleOutput('🎉 Workflow simulation completed successfully!', 'success');

    // Start countdown for reset
    this.addConsoleOutput('⏳ Resetting workflow in 5 seconds...', 'info');
    for (let i = 5; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.addConsoleOutput(`   ${i}...`, 'info');
    }

    // Reset the workflow
    this.resetWorkflow();
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

  // Prevent context menu on right click
  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): boolean {
    // Prevent right-click menu in the workflow canvas area
    const canvas = this.workflowCanvas?.nativeElement;
    if (canvas && canvas.contains(event.target as Node)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  centerView() {
    // Reset pan and zoom to center the workflow
    this.zoomLevel = 1;
    this.panPosition = { x: 0, y: 0 };
    this.lastPanPosition = { x: 0, y: 0 };
  }

  private addConsoleOutput(text: string, type: ConsoleOutput['type'] = 'info') {
    this.consoleOutput.push({ text, type });
    
    // Scroll console to bottom
    setTimeout(() => {
      const consoleContent = document.querySelector('.console-content');
      if (consoleContent) {
        consoleContent.scrollTop = consoleContent.scrollHeight;
      }
    }, 0);
  }

  ngOnInit() {
    this.startStepAnimation();
  }

  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  private startStepAnimation() {
    // Clear any existing interval
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }

    // Start the animation cycle
    this.animationInterval = setInterval(() => {
      this.currentHighlightedStep = (this.currentHighlightedStep + 1) % this.workflowSteps.length;
    }, this.STEP_DURATION);
  }

  startPan(event: MouseEvent) {
    // Handle right-click pan
    if (event.button === 2) {
      event.preventDefault();
      this.isPanning = true;
      this.panStart = {
        x: event.clientX - this.lastPanPosition.x,
        y: event.clientY - this.lastPanPosition.y
      };
    }
  }

  pan(event: MouseEvent) {
    if (this.isPanning) {
      event.preventDefault();
      requestAnimationFrame(() => {
        this.panPosition = {
          x: event.clientX - this.panStart.x,
          y: event.clientY - this.panStart.y
        };
      });
    }
  }

  endPan() {
    this.isPanning = false;
    this.lastPanPosition = { ...this.panPosition };
  }

  toggleFaq(category: FaqCategory, item: FaqItem) {
    // Close all other items in all categories
    this.faqCategories.forEach(cat => {
      cat.items.forEach(faqItem => {
        if (faqItem !== item) {
          faqItem.isOpen = false;
        }
      });
    });
    // Toggle the clicked item
    item.isOpen = !item.isOpen;
  }

  // Add this method for FAQ search
  getFilteredFaqs(): FaqCategory[] {
    if (!this.faqSearchQuery) {
      return this.faqCategories;
    }

    const query = this.faqSearchQuery.toLowerCase();
    return this.faqCategories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      )
    })).filter(category => category.items.length > 0);
  }
}
