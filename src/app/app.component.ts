import { Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDrag, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { WorkflowService, WorkflowData } from './services/workflow.service';

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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule]
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('workflowCanvas') workflowCanvas!: ElementRef;
  
  isScrolled = false;
  isSimulating = false;
  currentSimulationStep = -1;
  consoleOutput: ConsoleOutput[] = [];
  workflowData: WorkflowData;
  stepStatuses: StepStatus[] = [];
  workflowNodes: WorkflowNode[] = [];
  searchQuery: string = '';

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
    // Initialize any required properties
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
}
