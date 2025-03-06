import { Component, HostListener, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
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
export class AppComponent implements OnInit {
  @ViewChild('workflowCanvas') workflowCanvas!: ElementRef;
  
  isScrolled = false;
  isSimulating = false;
  currentSimulationStep = -1;
  consoleOutput: ConsoleOutput[] = [];
  workflowData: WorkflowData;
  stepStatuses: StepStatus[] = [];
  workflowNodes: WorkflowNode[] = [];
  searchQuery: string = '';

  // Panning and zooming
  isPanning = false;
  panStart = { x: 0, y: 0 };
  panPosition = { x: 0, y: 0 };
  lastPanPosition = { x: 0, y: 0 };
  zoomLevel = 1;
  readonly ZOOM_STEP = 0.1;
  readonly MIN_ZOOM = 0.5;
  readonly MAX_ZOOM = 2;

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
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const node = event.previousContainer.data[event.previousIndex];
      const newNode = {
        ...node,
        instanceId: `node_${this.workflowNodes.length + 1}`,
        // Remove badge when added to workflow
        badgeClass: '',
        source: ''
      };
      this.workflowNodes.push(newNode);
    }
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

  // Add auto-panning functionality
  private autoPanToNode(index: number) {
    setTimeout(() => {
      const nodeElement = document.querySelector(`[data-node-index="${index}"]`);
      if (nodeElement) {
        nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  ngOnInit() {
    // Initialize any additional setup if needed
  }

  startPan(event: MouseEvent) {
    // Always handle right-click pan
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
      // Use requestAnimationFrame for smooth panning
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

  private zoom(delta: number, event?: MouseEvent) {
    const newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoomLevel + delta));
    if (newZoom !== this.zoomLevel) {
      // Calculate the point to zoom towards (usually the mouse position)
      const canvas = this.workflowCanvas.nativeElement;
      const rect = canvas.getBoundingClientRect();
      const x = (event && event.clientX ? event.clientX - rect.left : rect.width / 2);
      const y = (event && event.clientY ? event.clientY - rect.top : rect.height / 2);

      // Calculate new position to keep the point under the mouse
      const scale = newZoom / this.zoomLevel;
      this.panPosition = {
        x: x - (x - this.panPosition.x) * scale,
        y: y - (y - this.panPosition.y) * scale
      };
      this.lastPanPosition = { ...this.panPosition };
      this.zoomLevel = newZoom;
    }
  }

  handleZoom(event: WheelEvent) {
    // Always handle zoom when mouse is in the workflow area
    event.preventDefault();
    const delta = event.deltaY > 0 ? -this.ZOOM_STEP : this.ZOOM_STEP;
    this.zoom(delta, event);
  }

  zoomIn() {
    this.zoom(this.ZOOM_STEP);
  }

  zoomOut() {
    this.zoom(-this.ZOOM_STEP);
  }

  async simulateWorkflow() {
    if (this.isSimulating) return;
    
    this.isSimulating = true;
    this.consoleOutput = [];
    this.initializeStepStatuses();
    
    try {
      for (let i = 0; i < this.workflowNodes.length; i++) {
        const node = this.workflowNodes[i];
        
        // Update status to active
        this.stepStatuses[i] = {
          isActive: true,
          isCompleted: false,
          isAnimatingFlow: false
        };
        
        // Keep active node in view
        this.scrollNodeIntoView(i);
        
        // Log start of processing
        this.consoleOutput = [...this.consoleOutput, { type: 'status', text: `\n⚡ Processing ${node.label}...` }];
        await this.delay(1000);
        
        // Process the node
        this.consoleOutput = [...this.consoleOutput, { type: 'status', text: `➡️ Applying workflow step` }];
        this.workflowData = node.processData(this.workflowData);
        await this.delay(500);
        
        // Mark as completed and animate flow
        this.consoleOutput = [...this.consoleOutput, { type: 'success', text: `✅ ${node.label} completed` }];
        this.stepStatuses[i] = {
          isActive: false,
          isCompleted: true,
          isAnimatingFlow: i < this.workflowNodes.length - 1
        };
        
        // Scroll console to bottom
        this.scrollConsole();
        await this.delay(1000);
      }
      
      this.consoleOutput = [...this.consoleOutput, { type: 'success', text: `\n✨ Workflow execution completed!` }];
    } catch (error: any) {
      this.consoleOutput = [...this.consoleOutput, { type: 'error', text: `\n❌ Error: ${error.message || 'Unknown error occurred'}` }];
    } finally {
      this.isSimulating = false;
      this.scrollConsole();
    }
  }

  private scrollNodeIntoView(index: number) {
    // Don't animate the start node
    if (index === 0) return;

    const nodeElement = document.querySelector(`[data-node-index="${index}"]`);
    if (nodeElement && this.workflowCanvas) {
      const canvas = this.workflowCanvas.nativeElement;
      const canvasRect = canvas.getBoundingClientRect();
      const nodeRect = nodeElement.getBoundingClientRect();

      // Calculate the target position to center the node
      const targetX = -((nodeRect.left - canvasRect.left) + (nodeRect.width / 2) - (canvasRect.width / 2)) / this.zoomLevel;
      const targetY = -((nodeRect.top - canvasRect.top) + (nodeRect.height / 2) - (canvasRect.height / 2)) / this.zoomLevel;

      // Directly set the position without animation for smoother workflow execution
      this.panPosition = {
        x: targetX,
        y: targetY
      };
      this.lastPanPosition = { ...this.panPosition };
    }
  }

  private async scrollConsole() {
    await this.delay(50); // Small delay to ensure DOM update
    const consoleElement = document.querySelector('.bg-gray-900.overflow-y-auto');
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

  private async delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
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
  }
}
