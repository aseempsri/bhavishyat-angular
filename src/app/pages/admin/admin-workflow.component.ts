import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BlogService } from '../../services/blog.service';
import {
  AssistantEvent,
  AssistantService,
  AssistantStatus,
  Booking,
  ChatMessage,
  ConversationSummary,
  LogEntry,
  RunSummary,
  StepRecord,
  StepStatus
} from '../../services/assistant.service';

type NodeGroup = 'main' | 'branch' | 'data' | 'pay' | 'team';
type ViewStatus = StepStatus | 'idle';

interface FlowNode {
  id: string;
  x: number;
  y: number;
  tag: string;
  title: string;
  sub: string;
  group: NodeGroup;
  about: string;
  trigger?: boolean;
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  d: string;
  dashed?: boolean;
}

interface RunState {
  summary: RunSummary;
  steps: Record<string, StepRecord>;
  order: string[];
  loaded: boolean;
}

interface ReplayState {
  steps: StepRecord[];
  index: number;
  phase: 'active' | 'final';
}

const NODE_W = 160;
const NODE_H = 64;
const CANVAS_W = 1780;
const CANVAS_H = 670;
const MAX_LOGS = 1000;

const NODES: FlowNode[] = [
  { id: 'receive', x: 20, y: 305, tag: 'Step 1 · Trigger', title: 'WhatsApp in', sub: 'Webhook + signature check', group: 'main', trigger: true, about: 'Meta calls the webhook for every incoming WhatsApp message. The X-Hub-Signature-256 header is verified with the app secret, duplicate deliveries are ignored, and the message is extracted.' },
  { id: 'parse', x: 210, y: 305, tag: 'Step 2', title: 'Parse & prepare', sub: 'Text, language, media', group: 'main', about: 'Cleans the text, detects Hindi / Hinglish / English, identifies media (image, voice, document) and the sender profile.' },
  { id: 'context', x: 300, y: 480, tag: 'MongoDB', title: 'Customer context', sub: 'Profile, history, birth data', group: 'data', about: 'Stores or loads the customer record: phone, name, chat history, birth details, preferences and handoff state. History is passed to the AI so replies stay in context.' },
  { id: 'classify', x: 400, y: 305, tag: 'Step 3 · AI', title: 'Intent classifier', sub: 'LLM JSON, rules fallback', group: 'main', about: 'The LLM classifies the intent (general FAQ, birth chart, astrology question, pricing/booking, payment, other) and extracts birth details. Without an API key, a keyword classifier is used.' },
  { id: 'route', x: 590, y: 305, tag: 'Step 4 · Switch', title: 'Route by intent', sub: 'Pick one branch', group: 'main', about: 'Switch node: sends the message down exactly one branch. Requests for a human always go to Other / Fallback.' },
  { id: 'br_faq', x: 800, y: 30, tag: 'Branch', title: 'General FAQ', sub: 'About, services, process', group: 'branch', about: 'Questions about BHAVISHYAT, how consultations work, languages and policies.' },
  { id: 'br_chart', x: 800, y: 140, tag: 'Branch', title: 'Kundli / birth chart', sub: 'Needs date, time, place', group: 'branch', about: 'The client wants their Kundli or is sharing birth details. Missing details are requested one reply at a time.' },
  { id: 'br_question', x: 800, y: 250, tag: 'Branch', title: 'Astrology question', sub: 'Career, marriage, timing', group: 'branch', about: 'Life questions. Uses the knowledge base plus the client’s chart and running dasha when birth details are known.' },
  { id: 'br_pricing', x: 800, y: 360, tag: 'Branch', title: 'Pricing / booking', sub: 'Packages, BOOK command', group: 'branch', about: 'Shares the consultation packages. “BOOK SIGNATURE” (or similar) creates a payment link.' },
  { id: 'br_payment', x: 800, y: 470, tag: 'Branch', title: 'Payment query', sub: 'Status of a booking', group: 'branch', about: 'Looks up the latest booking for the number and checks Razorpay for its payment status.' },
  { id: 'br_other', x: 800, y: 580, tag: 'Branch', title: 'Other / fallback', sub: 'Out of scope, human', group: 'team', about: 'Complex, unclear or out-of-scope messages, and explicit requests for a person. These go to the team.' },
  { id: 'kb', x: 1010, y: 85, tag: 'Step 5 · RAG', title: 'Knowledge base', sub: 'FAQ, prices, articles', group: 'data', about: 'Retrieves the most relevant passages from the FAQ, packages, policies and published blog articles so the AI answers only from verified content.' },
  { id: 'calc', x: 1010, y: 205, tag: 'Step 5 · Engine', title: 'Calculation engine', sub: 'Lagna, Rashi, dasha', group: 'data', about: 'Computes the sidereal (Lahiri) Lagna, Moon sign, Sun sign, Nakshatra and pada, Vimshottari mahadasha / antardasha and today’s transits from the birth details.' },
  { id: 'pay_link', x: 1010, y: 360, tag: 'Payment', title: 'Payment link', sub: 'Razorpay link', group: 'pay', about: 'Creates a Razorpay payment link for the chosen package with the booking reference, and reuses a pending link from the last 24 hours.' },
  { id: 'pay_verify', x: 1010, y: 470, tag: 'Payment', title: 'Verify payment', sub: 'Webhook / status check', group: 'pay', about: 'Razorpay calls the webhook when a link is paid. The signature is verified and repeat events are ignored. Payment queries also poll Razorpay directly.' },
  { id: 'handoff', x: 1010, y: 580, tag: 'Human', title: 'Team handoff', sub: 'Notify + pause bot', group: 'team', about: 'Notifies the team on WhatsApp / Slack with the recent chat, then pauses the bot for this client until the team resolves the handoff here.' },
  { id: 'booking', x: 1220, y: 470, tag: 'Booking', title: 'Create booking', sub: 'Confirm, PDF, alert team', group: 'pay', about: 'Confirms the booking, generates the Kundli summary PDF when birth details are known, asks for missing details and preferred times, and alerts the team to schedule.' },
  { id: 'generate', x: 1220, y: 250, tag: 'Step 6 · AI', title: 'Response generator', sub: 'Verified facts + brand voice', group: 'main', about: 'The LLM writes a personalised reply from the verified facts only (knowledge base, chart, booking) in the brand voice and the client’s language. Templates are used without an API key.' },
  { id: 'format', x: 1410, y: 250, tag: 'Step 7', title: 'Format message', sub: 'Bold, lists, links', group: 'main', about: 'Converts to WhatsApp formatting (*bold*, bullet lists), adds article links and the suggested next step, and caps the length.' },
  { id: 'send', x: 1600, y: 250, tag: 'Step 8', title: 'Send reply', sub: 'WhatsApp + PDF', group: 'main', about: 'Sends the reply (and any PDF) through the WhatsApp Cloud API and stores it in the chat history. In demo mode the reply appears in the simulator only.' }
];

const NODE_BY_ID = new Map(NODES.map((node) => [node.id, node]));

function horizontal(a: FlowNode, b: FlowNode): string {
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const dx = Math.max(36, (x2 - x1) / 2);
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

function edge(from: string, to: string, kind: 'h' | 'down' | 'up' | 'vertical' = 'h', dashed = false): FlowEdge {
  const a = NODE_BY_ID.get(from)!;
  const b = NODE_BY_ID.get(to)!;
  let d: string;
  if (kind === 'down') {
    const sx = a.x + NODE_W / 2;
    const sy = a.y + NODE_H;
    const ey = b.y + NODE_H / 2;
    d = `M${sx},${sy} C${sx},${ey} ${b.x - 40},${ey} ${b.x},${ey}`;
  } else if (kind === 'up') {
    const sy = a.y + NODE_H / 2;
    const sx = a.x + NODE_W;
    const ex = b.x + NODE_W / 2;
    const ey = b.y + NODE_H;
    d = `M${sx},${sy} C${ex},${sy} ${ex},${sy} ${ex},${ey}`;
  } else if (kind === 'vertical') {
    const x = a.x + NODE_W / 2;
    d = `M${x},${a.y} L${x},${b.y + NODE_H}`;
  } else {
    d = horizontal(a, b);
  }
  return { id: `${from}>${to}`, from, to, d, dashed };
}

const EDGES: FlowEdge[] = [
  edge('receive', 'parse'),
  edge('parse', 'context', 'down'),
  edge('context', 'classify', 'up'),
  edge('classify', 'route'),
  ...['br_faq', 'br_chart', 'br_question', 'br_pricing', 'br_payment', 'br_other'].map((id) => edge('route', id)),
  edge('br_faq', 'kb'),
  edge('br_question', 'kb'),
  edge('br_pricing', 'kb'),
  edge('br_chart', 'calc'),
  edge('br_question', 'calc'),
  edge('br_pricing', 'pay_link'),
  edge('br_payment', 'pay_verify'),
  edge('br_other', 'handoff'),
  edge('context', 'handoff', 'h', true),
  edge('pay_verify', 'booking'),
  edge('kb', 'generate'),
  edge('calc', 'generate'),
  edge('pay_link', 'generate'),
  edge('pay_verify', 'generate'),
  edge('handoff', 'generate'),
  edge('booking', 'generate', 'vertical'),
  edge('generate', 'format'),
  edge('format', 'send')
];

const DONE_LIKE: ViewStatus[] = ['done', 'warn', 'skipped'];

const SAMPLE_PROMPTS = [
  'Namaste! What is BHAVISHYAT?',
  'I want my kundli',
  '12 Aug 1990, 10:30 am, Lucknow',
  'Will I get a job change this year?',
  'What are your consultation prices?',
  'BOOK SIGNATURE',
  'I have paid, what is my booking status?',
  'मेरी शादी कब होगी?',
  'I want to talk to a real person'
];

const INTENT_LABEL: Record<string, string> = {
  general_faq: 'General FAQ',
  birth_chart: 'Birth chart',
  astrology_question: 'Astrology question',
  pricing_booking: 'Pricing / booking',
  payment_query: 'Payment query',
  payment_received: 'Payment received',
  other: 'Other / handoff'
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

@Component({
  selector: 'app-admin-workflow',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-workflow.component.html',
  styleUrl: './admin-workflow.component.css'
})
export class AdminWorkflowComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly blog = inject(BlogService);
  private readonly api = inject(AssistantService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('viewport') viewport?: ElementRef<HTMLDivElement>;
  @ViewChild('logBox') logBox?: ElementRef<HTMLDivElement>;
  @ViewChild('chatBox') chatBox?: ElementRef<HTMLDivElement>;

  readonly nodes = NODES;
  readonly edges = EDGES;
  readonly canvasW = CANVAS_W;
  readonly canvasH = CANVAS_H;
  readonly samplePrompts = SAMPLE_PROMPTS;

  checking = signal(true);
  authed = signal(false);
  password = '';
  loginError = signal('');

  status = signal<AssistantStatus | null>(null);
  connected = signal(false);
  notice = signal('');

  runs = signal<Record<string, RunState>>({});
  selectedRunId = signal<string | null>(null);
  followLive = signal(true);
  replay = signal<ReplayState | null>(null);
  selectedNodeId = signal<string | null>(null);

  logs = signal<LogEntry[]>([]);
  logLevel = signal<'all' | 'warn' | 'error'>('all');
  logRunOnly = signal(false);
  logPaused = signal(false);
  autoScroll = signal(true);
  private pausedLogs: LogEntry[] = [];

  chatPhone = signal('');
  chatName = signal('Demo Client');
  chatChannel = signal<'simulator' | 'whatsapp'>('simulator');
  chatMessages = signal<ChatMessage[]>([]);
  sendAs = signal<'customer' | 'team'>('customer');
  draft = '';
  sending = signal(false);

  conversations = signal<ConversationSummary[]>([]);
  bookings = signal<Booking[]>([]);
  panelTab = signal<'runs' | 'conversations' | 'bookings'>('runs');

  fitScale = signal(0.8);
  zoom = signal(1);
  scale = computed(() => Math.max(0.35, Math.min(1.6, this.fitScale() * this.zoom())));

  private streamSub: Subscription | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private replayTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  runList = computed(() =>
    Object.values(this.runs())
      .map((run) => run.summary)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 40)
  );

  selectedRun = computed(() => {
    const id = this.selectedRunId();
    return id ? this.runs()[id] || null : null;
  });

  nodeViews = computed<Record<string, { status: ViewStatus; step: StepRecord | null; ms: number | null }>>(() => {
    const views: Record<string, { status: ViewStatus; step: StepRecord | null; ms: number | null }> = {};
    for (const node of NODES) views[node.id] = { status: 'idle', step: null, ms: null };
    const replay = this.replay();
    const run = this.selectedRun();
    let steps: StepRecord[] = [];
    if (replay) {
      steps = replay.steps.slice(0, replay.index + 1).map((step, i) =>
        i === replay.index && replay.phase === 'active' ? { ...step, status: 'active' as StepStatus } : step
      );
    } else if (run) {
      steps = run.order.map((id) => run.steps[id]);
    }
    for (const step of steps) {
      if (!views[step.id]) continue;
      const ms = step.startedAt && step.endedAt ? new Date(step.endedAt).getTime() - new Date(step.startedAt).getTime() : null;
      views[step.id] = { status: step.status, step, ms };
    }
    return views;
  });

  edgeStates = computed<Record<string, 'idle' | 'flow' | 'done'>>(() => {
    const views = this.nodeViews();
    const out: Record<string, 'idle' | 'flow' | 'done'> = {};
    for (const e of EDGES) {
      const a = views[e.from].status;
      const b = views[e.to].status;
      if (DONE_LIKE.includes(a) && b === 'active') out[e.id] = 'flow';
      else if (DONE_LIKE.includes(a) && (DONE_LIKE.includes(b) || b === 'error')) out[e.id] = 'done';
      else out[e.id] = 'idle';
    }
    if (views['context'].status !== 'idle' && views['classify'].status !== 'idle') out['context>handoff'] = 'idle';
    return out;
  });

  dimIdle = computed(() => {
    const run = this.selectedRun();
    return Boolean(this.replay() || (run && run.summary.status !== 'running'));
  });

  selectedNode = computed(() => {
    const id = this.selectedNodeId();
    if (!id) return null;
    const node = NODE_BY_ID.get(id)!;
    return { node, view: this.nodeViews()[id] };
  });

  visibleLogs = computed(() => {
    const level = this.logLevel();
    const runId = this.logRunOnly() ? this.selectedRunId() : null;
    return this.logs().filter((log) => {
      if (level === 'warn' && log.level !== 'warn' && log.level !== 'error') return false;
      if (level === 'error' && log.level !== 'error') return false;
      if (runId && log.runId !== runId) return false;
      return true;
    });
  });

  chatHandoff = computed(() => this.conversations().find((c) => c.phone === this.chatPhone())?.handoff || false);

  ngOnInit(): void {
    this.blog.session().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (session) => {
        this.checking.set(false);
        this.authed.set(session.ok);
        if (session.ok) this.start();
      },
      error: () => {
        this.checking.set(false);
        this.loginError.set('The API is not running. Start it with npm run start:api.');
      }
    });
  }

  ngAfterViewInit(): void {
    this.observeViewport();
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    if (this.replayTimer) clearTimeout(this.replayTimer);
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }

  signIn(): void {
    this.loginError.set('');
    this.blog.login(this.password).subscribe({
      next: (result) => {
        this.blog.rememberToken(result.token);
        this.password = '';
        this.authed.set(true);
        this.start();
      },
      error: (err) => this.loginError.set(err?.error?.error || 'Could not sign in.')
    });
  }

  signOut(): void {
    this.streamSub?.unsubscribe();
    this.blog.logout().subscribe({ next: () => this.resetSession(), error: () => this.resetSession() });
  }

  private resetSession(): void {
    this.blog.clearToken();
    this.authed.set(false);
    this.connected.set(false);
  }

  private start(): void {
    setTimeout(() => this.observeViewport());
    this.api.status().subscribe({
      next: (status) => {
        this.status.set(status);
        if (!this.chatPhone()) this.openChat(status.demoPhone, 'Demo Client', 'simulator');
      }
    });
    this.loadRunList();
    this.loadConversations();
    this.loadBookings();
    this.streamSub?.unsubscribe();
    this.streamSub = this.api.stream().subscribe({
      next: (event) => this.handle(event),
      error: () => {
        this.connected.set(false);
        this.resetSession();
        this.loginError.set('Your session expired. Please sign in again.');
      }
    });
  }

  private observeViewport(): void {
    const el = this.viewport?.nativeElement;
    if (!el || this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.fitScale.set(Math.max(0.5, Math.min(1.1, (el.clientWidth - 14) / CANVAS_W)));
    });
    this.resizeObserver.observe(el);
  }

  private handle(event: AssistantEvent): void {
    switch (event.kind) {
      case 'connection':
        this.connected.set(event.state === 'open');
        break;
      case 'hello': {
        this.logs.set(event.logs.slice(-MAX_LOGS));
        for (const run of event.runs) this.upsertRun(run);
        const latest = [...event.runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
        if (latest && this.followLive() && !this.selectedRunId()) this.selectRun(latest.id, true);
        this.scrollLogs();
        break;
      }
      case 'run':
        this.upsertRun(event.run);
        if (this.followLive() && event.run.status === 'running' && this.selectedRunId() !== event.run.id) {
          this.stopReplay();
          this.selectRun(event.run.id, true);
        }
        if (event.run.status !== 'running') {
          this.scheduleRefresh();
          if (this.followLive() && this.selectedRunId() === event.run.id) this.startReplay(true);
        }
        break;
      case 'step':
        this.upsertStep(event.runId, event.step);
        break;
      case 'log':
        if (this.logPaused()) {
          this.pausedLogs.push(event.log);
        } else {
          this.logs.update((list) => [...list, event.log].slice(-MAX_LOGS));
          this.scrollLogs();
        }
        break;
      case 'chat':
        if (event.message.phone === this.chatPhone()) {
          this.chatMessages.update((list) => (list.some((m) => m.id === event.message.id) ? list : [...list, event.message]));
          this.scrollChat();
        }
        this.scheduleRefresh();
        break;
      case 'booking':
        this.bookings.update((list) => [event.booking, ...list.filter((b) => b.reference !== event.booking.reference)]);
        break;
      case 'handoff':
        this.scheduleRefresh();
        break;
      case 'reset':
        this.runs.set({});
        this.selectedRunId.set(null);
        this.chatMessages.set([]);
        this.loadBookings();
        this.loadConversations();
        break;
    }
  }

  private upsertRun(summary: RunSummary): void {
    this.runs.update((all) => {
      const existing = all[summary.id];
      return { ...all, [summary.id]: existing ? { ...existing, summary } : { summary, steps: {}, order: [], loaded: false } };
    });
  }

  private upsertStep(runId: string, step: StepRecord): void {
    this.runs.update((all) => {
      const existing = all[runId];
      if (!existing) return all;
      const order = existing.order.includes(step.id) ? existing.order : [...existing.order, step.id];
      return { ...all, [runId]: { ...existing, steps: { ...existing.steps, [step.id]: step }, order } };
    });
  }

  private loadRunList(): void {
    this.api.runs().subscribe({
      next: ({ runs }) => {
        for (const run of runs) this.upsertRun(run);
        if (!this.selectedRunId() && runs[0]) this.selectRun(runs[0].id, true);
      }
    });
  }

  private loadConversations(): void {
    this.api.conversations().subscribe({ next: ({ conversations }) => this.conversations.set(conversations) });
  }

  private loadBookings(): void {
    this.api.bookings().subscribe({ next: ({ bookings }) => this.bookings.set(bookings) });
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      this.loadConversations();
      this.api.status().subscribe({ next: (status) => this.status.set(status) });
    }, 600);
  }

  selectRun(id: string, live = false): void {
    if (!live) {
      this.followLive.set(false);
      this.stopReplay();
    }
    this.selectedRunId.set(id);
    const run = this.runs()[id];
    if (run && !run.loaded && run.summary.status !== 'running') this.loadRun(id);
    else if (run && !run.loaded && run.order.length === 0) this.loadRun(id);
  }

  private loadRun(id: string, then?: () => void): void {
    this.api.run(id).subscribe({
      next: ({ run }) => {
        this.runs.update((all) => {
          const steps: Record<string, StepRecord> = {};
          for (const step of run.steps) steps[step.id] = step;
          const existing = all[id];
          const merged = existing ? { ...steps, ...existing.steps } : steps;
          const order = [...run.steps.map((s) => s.id), ...(existing?.order || []).filter((s) => !steps[s])];
          return { ...all, [id]: { summary: existing?.summary || run, steps: merged, order, loaded: true } };
        });
        then?.();
      }
    });
  }

  toggleLive(): void {
    const next = !this.followLive();
    this.followLive.set(next);
    this.stopReplay();
    if (next) {
      const latest = this.runList()[0];
      if (latest) this.selectRun(latest.id, true);
    }
  }

  startReplay(live = false): void {
    const run = this.selectedRun();
    if (!run) return;
    const go = () => {
      const current = this.runs()[run.summary.id];
      const steps = current.order.map((id) => current.steps[id]).filter(Boolean);
      if (!steps.length) return;
      if (this.replayTimer) clearTimeout(this.replayTimer);
      if (!live) this.followLive.set(false);
      this.replaySpeed = live ? 0.6 : 1;
      this.replay.set({ steps, index: 0, phase: 'active' });
      this.tickReplay();
    };
    if (live || run.loaded) go();
    else this.loadRun(run.summary.id, go);
  }

  private replaySpeed = 1;

  private tickReplay(): void {
    const state = this.replay();
    if (!state) return;
    const delay = (state.phase === 'active' ? 650 : 250) * this.replaySpeed;
    this.replayTimer = setTimeout(() => {
      const now = this.replay();
      if (!now) return;
      if (now.phase === 'active') {
        this.replay.set({ ...now, phase: 'final' });
      } else if (now.index + 1 < now.steps.length) {
        this.replay.set({ ...now, index: now.index + 1, phase: 'active' });
      } else {
        this.replayTimer = setTimeout(() => this.replay.set(null), 1200);
        return;
      }
      this.tickReplay();
    }, delay);
  }

  stopReplay(): void {
    if (this.replayTimer) clearTimeout(this.replayTimer);
    this.replay.set(null);
  }

  zoomBy(factor: number): void {
    this.zoom.update((z) => Math.max(0.5, Math.min(2, z * factor)));
  }

  selectNode(id: string): void {
    this.selectedNodeId.set(this.selectedNodeId() === id ? null : id);
  }

  json(value: unknown): string {
    if (value === null || value === undefined) return '—';
    return JSON.stringify(value, null, 2);
  }

  intentLabel(intent: string | null): string {
    return intent ? INTENT_LABEL[intent] || intent : '—';
  }

  runLabel(run: RunSummary): string {
    if (run.intent) return this.intentLabel(run.intent);
    if (run.status === 'running') return 'Classifying…';
    if (run.status === 'paused') return 'Bot paused (with team)';
    if (run.status === 'error') return 'Failed';
    return 'Duplicate ignored';
  }

  nodeSub(node: FlowNode): string {
    const view = this.nodeViews()[node.id];
    return view.step?.summary || node.sub;
  }

  setLogLevel(value: string): void {
    this.logLevel.set(value as 'all' | 'warn' | 'error');
  }

  toggleLogPause(): void {
    const paused = !this.logPaused();
    this.logPaused.set(paused);
    if (!paused && this.pausedLogs.length) {
      const buffered = this.pausedLogs;
      this.pausedLogs = [];
      this.logs.update((list) => [...list, ...buffered].slice(-MAX_LOGS));
      this.scrollLogs();
    }
  }

  clearLogs(): void {
    this.logs.set([]);
    this.pausedLogs = [];
  }

  pausedCount(): number {
    return this.pausedLogs.length;
  }

  onLogScroll(): void {
    const el = this.logBox?.nativeElement;
    if (!el) return;
    this.autoScroll.set(el.scrollHeight - el.scrollTop - el.clientHeight < 30);
  }

  private scrollLogs(): void {
    if (!this.autoScroll()) return;
    setTimeout(() => {
      const el = this.logBox?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private scrollChat(): void {
    setTimeout(() => {
      const el = this.chatBox?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  openChat(phone: string, name: string, channel: 'simulator' | 'whatsapp'): void {
    this.chatPhone.set(phone);
    this.chatName.set(name || 'Demo Client');
    this.chatChannel.set(channel);
    this.sendAs.set(channel === 'whatsapp' ? 'team' : 'customer');
    this.chatMessages.set([]);
    this.api.conversation(phone).subscribe({
      next: (detail) => {
        this.chatMessages.set(detail.messages);
        this.chatChannel.set(detail.customer.channel);
        if (detail.customer.channel === 'whatsapp') this.sendAs.set('team');
        this.scrollChat();
      },
      error: () => this.chatMessages.set([])
    });
  }

  newDemoChat(): void {
    const suffix = String(Math.floor(10000 + Math.random() * 89999));
    this.openChat(`9199999${suffix}`, 'Demo Client', 'simulator');
  }

  usePrompt(text: string): void {
    this.draft = text;
    this.send();
  }

  send(): void {
    const text = this.draft.trim();
    const phone = this.chatPhone();
    if (!text || !phone || this.sending()) return;
    this.sending.set(true);
    const done = () => {
      this.sending.set(false);
      this.draft = '';
    };
    if (this.sendAs() === 'team') {
      this.api.reply(phone, text).subscribe({
        next: done,
        error: (err) => {
          this.sending.set(false);
          this.notice.set(err?.error?.error || 'Could not send the reply.');
        }
      });
      return;
    }
    if (!this.followLive()) this.toggleLive();
    this.api.simulate({ phone, name: this.chatName(), text }).subscribe({
      next: done,
      error: (err) => {
        this.sending.set(false);
        this.notice.set(err?.error?.error || 'Could not send the message.');
      }
    });
  }

  setHandoff(active: boolean): void {
    const phone = this.chatPhone();
    this.api.setHandoff(phone, active).subscribe({
      next: () => {
        this.notice.set(active ? 'The bot is paused for this client. Reply as the team below.' : 'Handoff resolved. The bot will answer again.');
        this.loadConversations();
      },
      error: (err) => this.notice.set(err?.error?.error || 'Could not update the handoff.')
    });
  }

  demoBookingFor(message: ChatMessage): Booking | null {
    if (message.author !== 'bot' || !message.text.includes('rzp.io/demo/')) return null;
    const booking = this.bookings().find((b) => b.paymentUrl && message.text.includes(b.paymentUrl));
    return booking && booking.status === 'pending' ? booking : null;
  }

  markPaid(booking: Booking): void {
    if (!this.followLive()) this.toggleLive();
    this.api.markPaid(booking.reference).subscribe({
      error: (err) => this.notice.set(err?.error?.error || 'Could not mark the booking as paid.')
    });
  }

  downloadReport(reportId: string, filename = 'Bhavishyat-Kundli.pdf'): void {
    this.api.report(reportId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      },
      error: () => this.notice.set('Could not download the report.')
    });
  }

  resetDemo(): void {
    if (!confirm('Clear all simulator conversations, runs and demo bookings? Real WhatsApp data is kept.')) return;
    this.api.resetDemo().subscribe({
      next: (result) => {
        this.notice.set(`Cleared ${result.cleared} demo conversation(s).`);
        const phone = this.status()?.demoPhone;
        if (phone) this.openChat(phone, 'Demo Client', 'simulator');
      }
    });
  }

  copy(text: string): void {
    navigator.clipboard?.writeText(text).then(() => this.notice.set('Copied to clipboard.'));
  }

  waHtml(text: string): string {
    return escapeHtml(text)
      .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
      .replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,!?])/g, '$1<i>$2</i>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
  }

  trackNode = (_: number, node: FlowNode) => node.id;
}
