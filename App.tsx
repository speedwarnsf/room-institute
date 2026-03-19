import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { UploadZone } from './components/UploadZone';
import { ThemeToggle } from './components/ThemeToggle';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NetworkStatus, useNetworkStatus } from './components/NetworkStatus';
import { AnalysisLoading } from './components/EnhancedLoadingSkeleton';
import { AccessibilityProvider, AccessibilityToolbar, SkipNavigation, useAccessibility } from './components/AccessibilityFeatures';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { UserMenu } from './components/UserMenu';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useI18n } from './i18n/I18nContext';
import { canGenerate, canIterate, canAccessStudio, canSaveRoom, canExport, canCreateProject, canSaveToMoodBoard, getGateMessage } from './services/gating';
import { incrementFreeUsage } from './services/subscription';

// Lazy-loaded components (code splitting)
const AnalysisDisplay = lazy(() => import('./components/AnalysisDisplay').then(m => ({ default: m.AnalysisDisplay })));
const ChatInterface = lazy(() => import('./components/ChatInterface').then(m => ({ default: m.ChatInterface })));
const SessionManager = lazy(() => import('./components/SessionManager').then(m => ({ default: m.SessionManager })));
const ShareButton = lazy(() => import('./components/ShareButton').then(m => ({ default: m.ShareButton })));
const DesignOptionsView = lazy(() => import('./components/DesignOptionsView').then(m => ({ default: m.DesignOptionsView })));
const DesignDetailView = lazy(() => import('./components/DesignOptionsView').then(m => ({ default: m.DesignDetailView })));
const MyRoomsGallery = lazy(() => import('./components/MyRoomsGallery').then(m => ({ default: m.MyRoomsGallery })));
const Lookbook = lazy(() => import('./components/Lookbook'));
const DesignStudio = lazy(() => import('./components/DesignStudio'));
const RoomManager = lazy(() => import('./components/RoomManager'));
const StructureAssessment = lazy(() => import('./components/StructureAssessment').then(m => ({ default: m.StructureAssessment })));
const UpgradePrompt = lazy(() => import('./components/UpgradePrompt').then(m => ({ default: m.UpgradePrompt })));
const ProjectManager = lazy(() => import('./components/ProjectManager').then(m => ({ default: m.ProjectManager })));
const PricingPage = lazy(() => import('./components/PricingPage').then(m => ({ default: m.PricingPage })));
const AuthGate = lazy(() => import('./components/AuthGate').then(m => ({ default: m.AuthGate })));
const SharePage = lazy(() => import('./components/SharePage').then(m => ({ default: m.SharePage })));
const DiscoverPage = lazy(() => import('./components/DiscoverPage'));
import { TrendingStyles } from './components/TrendingStyles';
import { 
  analyzeImage, 
  createChatSession, 
  generateRoomVisualization,
  generateDesignOptions,
  generateDesignVisualization,
  iterateDesign,
  detectRoomStructure,
  isApiConfigured,
  GeminiApiError
} from './services/geminiService';
import { compressImage } from './services/imageCompression';
import { rateLimiter } from './services/rateLimiter';
import { saveSession, SavedSession } from './services/sessionStorage';
import { saveRoom as saveRoomToHouse, getRooms, createRoom } from './services/houseRoomStorage';
import { saveLookbook, loadLookbook, clearLookbook, saveRoomImage, loadRoomImage, saveVisualizationImage, loadAllVisualizationImages } from './services/lookbookStorage';
import { validateImageFile, preprocessImage } from './services/edgeCaseHandlers';
import { analytics } from './services/analytics';
import { getErrorMessage } from './services/errorMessages';
import { validateChatMessage } from './services/validation';
import { AnalysisResult, AppState, ChatMessage, AppError, UploadedImage, DesignAnalysis, DesignOption, ShoppingListData, FlowMode, LookbookEntry, DesignRating, StructureDetectionResult, StructureChoices, Room } from './types';
import { generateShoppingList, shoppingListFromProducts } from './services/shoppingListGenerator';
// Avoid importing @google/genai client-side just for a type
type Chat = any;
import { ModeSelect, type DesignPreferences } from './components/ModeSelect';
import { DESIGN_STYLES, ROOM_FUNCTIONS } from './components/PreferencesPanel';
import { LayoutGrid, ArrowLeft, AlertCircle, RefreshCw, WifiOff, Clock, Home, Camera, Palette, Wand2, FolderOpen, TrendingUp, Menu, X } from 'lucide-react';

/**
 * Animated counter for social proof — shows total designs generated
 */
function DesignCounter() {
  const { t } = useI18n();
  const [count, setCount] = useState(0);
  // Seed: 14,847 designs + a slow trickle based on time
  const target = 14847 + Math.floor((Date.now() - 1739500000000) / 180000);

  useEffect(() => {
    const duration = 1800;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 mb-8">
      <TrendingUp className="w-4 h-4 text-emerald-500" />
      <span className="text-sm">
        <span className="font-semibold text-stone-600 dark:text-stone-300 tabular-nums">{count.toLocaleString()}</span> {(t as any)('app.hero.designsGenerated')}
      </span>
    </div>
  );
}

/**
 * Main application component wrapper with enhanced providers
 */
function AppContent() {
  const { t } = useI18n();
  // Application state
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [visualizationImage, setVisualizationImage] = useState<string | null>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizationError, setVisualizationError] = useState<string | null>(null);
  
  // Chat state
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatTyping, setIsChatTyping] = useState(false);
  
  // Design options state (V2 flow)
  const [designAnalysis, setDesignAnalysis] = useState<DesignAnalysis | null>(null);
  const [selectedDesignIndex, setSelectedDesignIndex] = useState<number | null>(null);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [isVisualizingDesign, setIsVisualizingDesign] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListData | null>(null);
  const [lookbookEntries, setLookbookEntries] = useState<LookbookEntry[]>([]);
  const [studioEntry, setStudioEntry] = useState<LookbookEntry | null>(null);

  // Structure detection state
  const [structureDetection, setStructureDetection] = useState<StructureDetectionResult | null>(null);
  const [structureChoices, setStructureChoices] = useState<StructureChoices | null>(null);
  const [isDetectingStructure, setIsDetectingStructure] = useState(false);

  // Error state
  const [error, setError] = useState<AppError | null>(null);
  
  // Session state
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [currentRoomId, setCurrentRoomId] = useState<string | undefined>(undefined);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  // Enhanced state for production features
  const [analysisStage, setAnalysisStage] = useState<'uploading' | 'processing' | 'analyzing' | 'generating' | 'visualizing'>('uploading');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Auth & gating state
  const { user, userTier, refreshTier } = useAuth();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Network and accessibility hooks
  const networkStatus = useNetworkStatus();
  const { announce, playSound } = useAccessibility();

  const buildAppError = useCallback((
    code: string,
    message?: string,
    isRetryable?: boolean,
    suggestion?: string
  ): AppError => {
    const mapped = getErrorMessage(code);
    return {
      code,
      message: message ?? mapped.description,
      title: mapped.title,
      suggestion: suggestion ?? mapped.suggestion,
      isRetryable: isRetryable ?? mapped.isRetryable
    };
  }, []);

  // Check API configuration on mount
  useEffect(() => {
    if (!isApiConfigured()) {
      console.warn('Room: Gemini API key not configured');
    }
  }, []);

  // Restore lookbook from localStorage on mount
  const [hasSavedLookbook, setHasSavedLookbook] = useState(false);
  useEffect(() => {
    const saved = loadLookbook();
    if (saved && saved.length > 0) {
      setHasSavedLookbook(true);
    }
  }, []);

  // Persist lookbook entries to localStorage (metadata only)
  useEffect(() => {
    if (lookbookEntries.length > 0) {
      saveLookbook(lookbookEntries);
      setHasSavedLookbook(true);
    }
  }, [lookbookEntries]);

  // Persist visualization images to IndexedDB
  useEffect(() => {
    lookbookEntries.forEach(entry => {
      if (entry.option.visualizationImage) {
        saveVisualizationImage(entry.id, entry.option.visualizationImage);
      }
    });
  }, [lookbookEntries]);

  /**
   * Parse a data URL into its components
   */
  const parseDataUrl = useCallback((dataUrl: string): { base64: string; mimeType: string } | null => {
    const matches = dataUrl.match(/^data:([^;]+)(?:;charset=[^;]+)?;base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const mimeType = matches[1];
    const base64 = matches[2];
    if (!mimeType || !base64) {
      return null;
    }
    return { mimeType, base64 };
  }, []);

  /**
   * Detect structural elements in the uploaded image
   */
  const handleStructureDetection = useCallback(async () => {
    if (!uploadedImage) return;

    setIsDetectingStructure(true);
    setError(null);
    setAppState(AppState.STRUCTURE_ASSESSMENT);
    
    try {
      announce('Analyzing room structure...', 'polite');
      const result = await detectRoomStructure(uploadedImage.base64, uploadedImage.mimeType);
      setStructureDetection(result);
    } catch (error) {
      console.error('Structure detection failed:', error);
      if (error instanceof GeminiApiError) {
        setError(buildAppError(error.code, error.message, error.isRetryable));
      } else {
        setError(buildAppError('STRUCTURE_DETECTION_FAILED', t('error.structureDetectionFailed'), true));
      }
      setAppState(AppState.ERROR);
    } finally {
      setIsDetectingStructure(false);
    }
  }, [uploadedImage, announce, buildAppError]);

  /**
   * Handle user choices from structure assessment
   */
  const handleStructureChoices = (choices: StructureChoices) => {
    setStructureChoices(choices);
    // Show loading immediately so there's no blank white screen
    setAppState(AppState.ANALYZING);
    setAnalysisStage('analyzing');
    setAnalysisProgress(5);
    setIsAnalyzing(true);
    // Continue to design generation with structural constraints — pass choices directly
    // since React state won't be updated yet in the same tick
    handleDesignGeneration(choices);
  };

  /**
   * Generate designs with structural constraints
   */
  const handleDesignGeneration = useCallback(async (passedChoices?: StructureChoices) => {
    const choices = passedChoices || structureChoices;
    if (!uploadedImage) return;

    setAppState(AppState.ANALYZING);
    setIsAnalyzing(true);
    setError(null);
    
    try {
      setAnalysisStage('analyzing');
      setAnalysisProgress(5);
      analytics.trackAnalysisStart();
      announce('Generating design options with your structure preferences...', 'polite');

      // Create tiered structural constraints
      const constraints = choices ? {
        fixed: choices.elementsToKeepInPlace?.map(el => el.name),
        flexible: choices.elementsToKeepFlexible?.map(el => el.name)
      } : undefined;

      // Smooth progress animation
      let prog = 5;
      const progressInterval = setInterval(() => {
        prog += Math.max(0.5, (85 - prog) * 0.04);
        if (prog > 85) prog = 85;
        setAnalysisProgress(Math.round(prog));
      }, 300);

      // Generate design options with structural constraints
      const designResult = await generateDesignOptions(
        uploadedImage.base64,
        uploadedImage.mimeType,
        [],
        { structuralConstraints: constraints }
      );
      
      clearInterval(progressInterval);
      setAnalysisProgress(60);
      setDesignAnalysis(designResult);
      setSelectedDesignIndex(null);

      // Generate all visualizations BEFORE showing the lookbook
      setAnalysisStage('visualizing');
      let vizDone = 0;
      const totalViz = designResult.options.length;

      const entriesWithImages: LookbookEntry[] = designResult.options.map((opt, idx) => ({
        id: `design-${Date.now()}-${idx}`,
        option: opt,
        rating: null,
        generatedAt: Date.now(),
        batchIndex: 0,
      }));

      // Generate visualizations sequentially to avoid rate limits
      for (let idx = 0; idx < entriesWithImages.length; idx++) {
        const entry = entriesWithImages[idx]!;
        let retries = 2;
        while (retries >= 0) {
          try {
            const img = await generateDesignVisualization(
              entry.option.visualizationPrompt,
              uploadedImage.base64,
              uploadedImage.mimeType,
              constraints
            );
            entriesWithImages[idx] = { ...entry, option: { ...entry.option, visualizationImage: img } };
            (designResult.options[idx] as any).visualizationImage = img;
            break;
          } catch (e) {
            if (retries > 0) {
              console.warn(`Visualization for option ${idx} failed, retrying (${retries} left)...`, e);
              await new Promise(r => setTimeout(r, 2000));
              retries--;
            } else {
              console.warn(`Visualization for option ${idx} failed after all retries`, e);
              break;
            }
          }
        }
        vizDone++;
        setAnalysisProgress(60 + Math.round((vizDone / totalViz) * 35));
      }

      setAnalysisProgress(100);
      setLookbookEntries(entriesWithImages);
      setAppState(AppState.LOOKBOOK);
      analytics.trackAnalysisComplete(designResult.options.length);
      announce('Design options ready! Swipe through your personalized designs.', 'polite');
      playSound('success');

      // Track usage
      incrementFreeUsage().catch(() => {});
      refreshTier().catch(() => {});

    } catch (error) {
      console.error('Design generation failed:', error);
      if (error instanceof GeminiApiError) {
        setError(buildAppError(error.code, error.message, error.isRetryable));
      } else {
        setError(buildAppError('DESIGN_GENERATION_FAILED', t('error.designGenerationFailed'), true));
      }
      setAppState(AppState.ERROR);
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadedImage, structureChoices, announce, buildAppError, playSound, analytics, incrementFreeUsage, refreshTier]);

  /**
   * Handle image selection from the upload zone with enhanced validation
   */
  const handleImageSelected = useCallback(async (file: File) => {
    // Analytics tracking
    analytics.trackImageUpload(file);

    if (isAnalyzing) {
      const message = 'Analysis already in progress. Please wait for it to finish.';
      setRateLimitMessage(message);
      setTimeout(() => setRateLimitMessage(null), 4000);
      announce(message, 'polite');
      return;
    }
    
    // Check network connection
    if (!networkStatus.isOnline) {
      setError(buildAppError('NETWORK_OFFLINE'));
      setAppState(AppState.ERROR);
      announce(t('app.error.noInternet'), 'assertive');
      playSound('error');
      return;
    }

    // Check rate limit before processing
    if (!rateLimiter.tryConsume()) {
      const waitTime = rateLimiter.formatWaitTime();
      setRateLimitMessage(t('app.error.rateLimit').replace('{time}', waitTime));
      setTimeout(() => setRateLimitMessage(null), 5000);
      playSound('error');
      return;
    }

    try {
      // Stage 1: Validate file
      setAnalysisStage('uploading');
      setAnalysisProgress(10);
      setIsAnalyzing(true);
      setAppState(AppState.ANALYZING);
      setError(null);
      setCurrentSessionId(undefined);
      announce('Starting image analysis', 'polite');

      const validation = await validateImageFile(file);

      if (!validation.canProceed) {
        setError(buildAppError(
          'VALIDATION_FAILED',
          validation.error || t('app.error.invalidImage'),
          true,
          validation.suggestion
        ));
        setAppState(AppState.ERROR);
        analytics.track('image_rejected', { reason: validation.error });
        announce(validation.error || t('app.error.invalidImage'), 'assertive');
        playSound('error');
        setIsAnalyzing(false);
        return;
      }

      if (validation.warning) {
        announce(validation.warning, 'polite');
      }

      // Stage 2: Preprocess image (compression if needed)
      setAnalysisStage('processing');
      setAnalysisProgress(25);
      
      const preprocessResult = await preprocessImage(file);
      const processedFile = preprocessResult.file;
      
      if (preprocessResult.wasModified) {
        analytics.trackImageCompression(
          file.size,
          processedFile.size,
          0, 0 // Dimensions will be calculated later
        );
        announce(`Image optimized: ${preprocessResult.modifications[0]}`, 'polite');
      }

      // Stage 3: Convert file to base64
      setAnalysisProgress(40);
      const reader = new FileReader();
      
      reader.onerror = () => {
        setError(buildAppError(
          'FILE_READ_ERROR',
          t('app.error.readFailed'),
          true
        ));
        setAppState(AppState.ERROR);
        setIsAnalyzing(false);
        announce(t('app.error.readFailed'), 'assertive');
        playSound('error');
        analytics.track('analysis_failed', { stage: 'file_read', error: 'FILE_READ_ERROR' });
      };
      
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result as string;
          const parsed = parseDataUrl(dataUrl);
          
          if (!parsed) {
            throw new Error('Invalid image format after processing');
          }

          setUploadedImage({
            dataUrl,
            base64: parsed.base64,
            mimeType: parsed.mimeType,
            fileName: processedFile.name
          });

          // Go to mode selection — no AI call yet
          setAnalysisProgress(100);
          setAppState(AppState.MODE_SELECT);
          announce('Photo ready! Choose how to transform your space.', 'polite');
          playSound('success');
          
        } catch (readError) {
          console.error('Image processing error:', readError);
          setError(buildAppError('UNKNOWN', 'An unexpected error occurred. Please try again.', true));
          setAppState(AppState.ERROR);
          announce(t('error.processingFailed'), 'assertive');
          playSound('error');
        } finally {
          setIsAnalyzing(false);
          setAnalysisProgress(0);
        }
      };
      
      reader.readAsDataURL(processedFile);
    } catch (err) {
      console.error('File handling error:', err);
      setError(buildAppError('PROCESSING_ERROR', t('error.processingRetry'), true));
      setIsAnalyzing(false);
      setAppState(AppState.ERROR);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- analysisStage is intentionally excluded (stale closure)
  }, [announce, buildAppError, isAnalyzing, networkStatus.isOnline, parseDataUrl, playSound]);

  /**
   * Generate AI visualization of the organized room
   */
  const handleVisualize = useCallback(async () => {
    if (isVisualizing) return;

    if (!analysis?.visualizationPrompt) {
      setVisualizationError('Visualization instructions are missing. Please re-run the analysis.');
      return;
    }

    if (!uploadedImage) {
      setVisualizationError('Original image is not available. Please upload a new photo.');
      return;
    }

    if (!networkStatus.isOnline) {
      setVisualizationError(getErrorMessage('NETWORK_OFFLINE').description);
      announce('Visualization failed: no internet connection', 'assertive');
      return;
    }
    
    // Check rate limit
    if (!rateLimiter.tryConsume()) {
      const waitTime = rateLimiter.formatWaitTime();
      setVisualizationError(t('app.error.rateLimitWait').replace('{time}', waitTime));
      return;
    }
    
    try {
      setIsVisualizing(true);
      setVisualizationError(null);
      
      const base64Image = await generateRoomVisualization(
        analysis.visualizationPrompt,
        uploadedImage.base64,
        uploadedImage.mimeType
      );
      setVisualizationImage(base64Image);
    } catch (err) {
      console.error("Visualization failed:", err);
      if (err instanceof GeminiApiError) {
        setVisualizationError(getErrorMessage(err.code).description ?? err.message);
      } else {
        setVisualizationError(t('error.visualizationFailed'));
      }
    } finally {
      setIsVisualizing(false);
    }
  }, [analysis, announce, isVisualizing, networkStatus.isOnline, uploadedImage]);

  /**
   * Send a message in the chat
   */
  const handleSendMessage = useCallback(async (text: string) => {
    if (!chatSession) return;

    if (!networkStatus.isOnline) {
      const offlineMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: getErrorMessage('NETWORK_OFFLINE').description,
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, offlineMsg]);
      return;
    }

    const validation = validateChatMessage(text);
    if (!validation.valid) {
      const invalidMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: validation.error || 'Please enter a valid message.',
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, invalidMsg]);
      return;
    }
    
    // Check rate limit for chat messages
    if (!rateLimiter.tryConsume()) {
      const waitTime = rateLimiter.formatWaitTime();
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: t('app.error.rateLimitChat').replace('{time}', waitTime),
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsChatTyping(true);

    try {
      const result = await chatSession.sendMessage({ message: text });
      const responseText = result.text;

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I'm sorry, I couldn't generate a response. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an issue connecting to the service. Please try again.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatTyping(false);
    }
  }, [chatSession, networkStatus.isOnline]);

  /**
   * Reset the app to initial state
   */
  const resetApp = useCallback(() => {
    setAppState(AppState.HOME);
    setAnalysis(null);
    setUploadedImage(null);
    setVisualizationImage(null);
    setVisualizationError(null);
    setMessages([]);
    setChatSession(null);
    setError(null);
    setDesignAnalysis(null);
    setSelectedDesignIndex(null);
    setShoppingList(null);
    setCurrentRoomId(undefined);
    setLookbookEntries([]);
    clearLookbook();
  }, []);

  /**
   * Save current session
   */
  const handleSaveSession = useCallback(async () => {
    if (!analysis || !uploadedImage) return;
    
    try {
      const session = await saveSession(
        uploadedImage,
        analysis,
        messages,
        visualizationImage || undefined,
        currentSessionId
      );
      setCurrentSessionId(session.id);
    } catch (err) {
      console.error('Failed to save session:', err);
      throw err;
    }
  }, [analysis, messages, uploadedImage, visualizationImage, currentSessionId]);

  /**
   * Save current state as a room project
   */
  const handleSaveRoom = useCallback(async () => {
    if (!uploadedImage || !designAnalysis || selectedDesignIndex === null) return;
    try {
      // Convert current state to Room format
      const selectedDesign = designAnalysis.options[selectedDesignIndex];
      if (!selectedDesign) return;

      const lookbookEntries: LookbookEntry[] = designAnalysis.options.map((opt, idx) => ({
        id: `design-${Date.now()}-${idx}`,
        option: opt,
        rating: null,
        generatedAt: Date.now(),
        batchIndex: 0,
      }));

      const selectedEntry = lookbookEntries[selectedDesignIndex];
      if (!selectedEntry) return;

      let room: Room;
      if (currentRoomId) {
        // Update existing room
        const existingRoom = await getRooms().then(rooms => rooms.find(r => r.id === currentRoomId));
        if (existingRoom) {
          room = {
            ...existingRoom,
            sourceImage: uploadedImage.dataUrl,
            designs: lookbookEntries,
            selectedDesignId: selectedEntry.id,
            updatedAt: Date.now()
          };
        } else {
          // Create new room if existing not found
          room = createRoom(`Room — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, uploadedImage.dataUrl);
          room.designs = lookbookEntries;
          room.selectedDesignId = selectedEntry.id;
        }
      } else {
        // Create new room
        room = createRoom(`Room — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, uploadedImage.dataUrl);
        room.designs = lookbookEntries;
        room.selectedDesignId = selectedEntry.id;
      }

      await saveRoomToHouse(room);
      setCurrentRoomId(room.id);
    } catch (err) {
      console.error('Failed to save room:', err);
    }
  }, [uploadedImage, designAnalysis, selectedDesignIndex, currentRoomId]);

  /**
   * Load a room from the gallery
   */
  const handleLoadRoom = useCallback((room: Room, designIndex: number) => {
    const design = room.designs[designIndex];
    if (!design) return;

    // Convert room designs back to DesignAnalysis format
    const restoredOptions = room.designs.slice(0, 3).map(d => d.option) as [DesignOption, DesignOption, DesignOption];

    // Create a dummy room reading since the new storage doesn't separate it
    const roomReading = `This room shows potential for ${design.option.mood}. The space offers opportunities for thoughtful design intervention.`;

    setDesignAnalysis({ roomReading, options: restoredOptions });
    setSelectedDesignIndex(designIndex);
    setCurrentRoomId(room.id);

    // Set analysis for results view
    setAnalysis({
      rawText: `## ${design.option.name}\n\n*${design.option.mood}*\n\n${design.option.fullPlan}`,
      visualizationPrompt: design.option.visualizationPrompt,
      products: []
    });
    setVisualizationImage(design.option.visualizationImage || null);
    setShoppingList(null); // Shopping list is not stored in the new system

    // Restore image
    if (room.sourceImage) {
      const parsed = parseDataUrl(room.sourceImage);
      if (parsed) {
        setUploadedImage({
          dataUrl: room.sourceImage,
          base64: parsed.base64,
          mimeType: parsed.mimeType,
          fileName: 'room.jpg'
        });
      }
    }

    const chat = createChatSession(`Design: ${design.option.name}\n\n${design.option.mood}\n\n${design.option.fullPlan}`);
    setChatSession(chat);
    setMessages([]);
    setAppState(AppState.RESULTS);
  }, [parseDataUrl]);

  /**
   * Load a saved session
   */
  const handleLoadSession = useCallback((session: SavedSession) => {
    setAnalysis(session.analysis);
    setMessages(session.messages);
    setVisualizationImage(session.visualizationImage || null);
    setCurrentSessionId(session.id);
    setAppState(AppState.RESULTS);
    
    // Recreate chat session with analysis context
    const chat = createChatSession(session.analysis.rawText);
    setChatSession(chat);
    
    // Clear uploaded image (it's not stored due to size)
    setUploadedImage(null);
  }, []);

  /**
   * Retry after an error
   */
  const handleRetry = useCallback(() => {
    if (error?.isRetryable && uploadedImage) {
      // Re-analyze the already uploaded image
      setAppState(AppState.ANALYZING);
      setIsAnalyzing(true);
      setError(null);
      
      analyzeImage(uploadedImage.base64, uploadedImage.mimeType)
        .then(result => {
          setAnalysis(result);
          const chat = createChatSession(result.rawText);
          setChatSession(chat);
          setAppState(AppState.RESULTS);
          // Generate basic shopping list from products
          if (result.products?.length) {
            const sid = currentSessionId || `session-${Date.now()}`;
            setShoppingList(shoppingListFromProducts(result.products, sid));
          }
        })
        .catch(apiError => {
          if (apiError instanceof GeminiApiError) {
            setError(buildAppError(apiError.code, apiError.message, apiError.isRetryable));
          } else {
            setError(buildAppError('UNKNOWN', 'An unexpected error occurred. Please try again.', true));
          }
          setAppState(AppState.ERROR);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    } else {
      resetApp();
    }
  }, [buildAppError, error, uploadedImage, resetApp]);

  /**
   * Handle selecting one of the 3 design options
   */
  const handleSelectDesign = useCallback((index: number) => {
    setSelectedDesignIndex(index);
    if (designAnalysis && designAnalysis.options[index]) {
      const opt = designAnalysis.options[index]!;
      // Create a chat session scoped to this design
      const chat = createChatSession(
        `Design: ${opt.name}\n\n${opt.fullPlan}\n\nRoom Reading:\n${designAnalysis.roomReading}`
      );
      setChatSession(chat);
      // Build a legacy AnalysisResult for the results view
      setAnalysis({
        rawText: `## ${opt.name}\n\n*${opt.mood}*\n\n${opt.fullPlan}`,
        visualizationPrompt: opt.visualizationPrompt,
        products: []
      });
      setVisualizationImage(opt.visualizationImage || null);
      setAppState(AppState.RESULTS);
      // Generate shopping list for this design in the background
      const sid = currentSessionId || `session-${Date.now()}`;
      generateShoppingList(
        opt.name,
        opt.mood,
        opt.fullPlan,
        designAnalysis.roomReading,
        sid
      ).then(setShoppingList).catch(err => console.error('Shopping list error:', err));
    }
  }, [designAnalysis, currentSessionId]);

  /**
   * Go back from detail to 3-options view
   */
  const handleBackToOptions = useCallback(() => {
    setSelectedDesignIndex(null);
    setAppState(AppState.DESIGN_OPTIONS);
  }, []);

  /**
   * Handle rating a lookbook entry
   */
  const handleRate = useCallback((entryId: string, rating: DesignRating) => {
    setLookbookEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, rating } : e
    ));
  }, []);

  /**
   * Generate more designs for the lookbook
   */
  const handleGenerateMore = useCallback(async () => {
    if (!uploadedImage) return;
    setIsGeneratingVisuals(true);
    try {
      const previousNames = lookbookEntries.map(e => `${e.option.name}: ${e.option.mood}`);

      // Use the same constraints from the initial generation
      const constraints = structureChoices ? {
        fixed: structureChoices.elementsToKeepInPlace?.map(el => el.name),
        flexible: structureChoices.elementsToKeepFlexible?.map(el => el.name)
      } : undefined;

      const newBatch = await generateDesignOptions(uploadedImage.base64, uploadedImage.mimeType, previousNames, { structuralConstraints: constraints });
      const batchIndex = Math.max(0, ...lookbookEntries.map(e => e.batchIndex)) + 1;
      const newEntries: LookbookEntry[] = newBatch.options.map((opt, idx) => ({
        id: `design-${Date.now()}-${idx}`,
        option: opt,
        rating: null,
        generatedAt: Date.now(),
        batchIndex,
      }));
      setLookbookEntries(prev => [...newEntries, ...prev]);
      // Generate visualizations sequentially with retry
      (async () => {
        for (const entry of newEntries) {
          let retries = 2;
          while (retries >= 0) {
            try {
              const img = await generateDesignVisualization(
                entry.option.visualizationPrompt,
                uploadedImage.base64,
                uploadedImage.mimeType,
                constraints
              );
              setLookbookEntries(prev => prev.map(e =>
                e.id === entry.id ? { ...e, option: { ...e.option, visualizationImage: img } } : e
              ));
              break;
            } catch (err) {
              if (retries > 0) {
                await new Promise(r => setTimeout(r, 2000));
                retries--;
              } else {
                console.warn(`Viz failed for ${entry.id}`, err);
                break;
              }
            }
          }
        }
      })();
    } catch (err) {
      console.error('Generate more failed:', err);
    } finally {
      setIsGeneratingVisuals(false);
    }
  }, [uploadedImage, lookbookEntries, structureChoices]);

  /**
   * Go deeper on a lookbook entry — transition to Design Studio
   */
  const handleSelectForIteration = useCallback((entryId: string) => {
    if (!canAccessStudio(userTier)) {
      setShowUpgradePrompt('studio');
      return;
    }
    const entry = lookbookEntries.find(e => e.id === entryId);
    if (!entry) return;
    setStudioEntry(entry);
    setAppState(AppState.DESIGN_STUDIO);
  }, [lookbookEntries, userTier]);

  /**
   * Handle mode selection (Clean vs Redesign)
   */
  const handleModeSelect = useCallback(async (mode: FlowMode, preferences?: DesignPreferences) => {
    if (!uploadedImage) return;

    // Gate check: can generate?
    if (!canGenerate(userTier)) {
      setShowUpgradePrompt('generate');
      return;
    }

    setAppState(AppState.ANALYZING);
    setIsAnalyzing(true);
    setError(null);

    try {
      // Design flow - start with structure detection
      handleStructureDetection();
      return; // Exit early, continue with handleDesignGeneration after structure choices
    } catch (apiError) {
      console.error('Analysis error:', apiError);
      analytics.track('analysis_failed', {
        stage: 'analyzing',
        error: apiError instanceof GeminiApiError ? apiError.code : 'UNKNOWN',
        isRetryable: apiError instanceof GeminiApiError ? apiError.isRetryable : false
      });
      if (apiError instanceof GeminiApiError) {
        if (apiError.code === 'RATE_LIMIT' && apiError.retryAfterSeconds) {
          setRateLimitMessage(t('app.error.tooManyRequests').replace('{seconds}', String(apiError.retryAfterSeconds)));
          // Auto-countdown
          let remaining = apiError.retryAfterSeconds;
          const interval = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
              clearInterval(interval);
              setRateLimitMessage(null);
            } else {
              setRateLimitMessage(t('app.error.tooManyRequests').replace('{seconds}', String(remaining)));
            }
          }, 1000);
          setAppState(AppState.MODE_SELECT);
        } else {
          setError(buildAppError(apiError.code, apiError.message, apiError.isRetryable));
          setAppState(AppState.ERROR);
        }
      } else {
        setError(buildAppError('UNKNOWN', 'An unexpected error occurred. Please try again.', true));
        setAppState(AppState.ERROR);
      }
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      announce(t('app.error.analysisFailed').replace('{message}', errorMessage), 'assertive');
      playSound('error');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [uploadedImage, announce, playSound, buildAppError, currentSessionId]);

  /**
   * Generate visualization for a specific design option on the detail page
   */
  const handleVisualizeDesign = useCallback(async () => {
    if (selectedDesignIndex === null || !designAnalysis || !uploadedImage) return;
    const opt = designAnalysis.options[selectedDesignIndex];
    if (!opt) return;
    setIsVisualizingDesign(true);
    try {
      const constraints = structureChoices ? {
        fixed: structureChoices.elementsToKeepInPlace?.map(el => el.name),
        flexible: structureChoices.elementsToKeepFlexible?.map(el => el.name)
      } : undefined;

      const img = await generateDesignVisualization(
        opt.visualizationPrompt,
        uploadedImage.base64,
        uploadedImage.mimeType,
        constraints
      );
      setDesignAnalysis(prev => {
        if (!prev) return prev;
        const updated = { ...prev, options: [...prev.options] as [DesignOption, DesignOption, DesignOption] };
        updated.options[selectedDesignIndex] = Object.assign({}, updated.options[selectedDesignIndex], { visualizationImage: img }) as DesignOption;
        return updated;
      });
      setVisualizationImage(img);
    } catch (e) {
      console.error('Design visualization failed', e);
    } finally {
      setIsVisualizingDesign(false);
    }
  }, [selectedDesignIndex, designAnalysis, uploadedImage, structureChoices]);

  /**
   * Resume a saved lookbook from localStorage
   */
  const handleResumeLookbook = useCallback(async () => {
    const saved = loadLookbook();
    if (saved && saved.length > 0) {
      // Hydrate entries with visualization images from IndexedDB
      const imageMap = await loadAllVisualizationImages(saved.map(e => e.id));
      const hydrated = saved.map(entry => ({
        ...entry,
        option: {
          ...entry.option,
          visualizationImage: imageMap.get(entry.id) || entry.option.visualizationImage || undefined,
        },
      }));
      setLookbookEntries(hydrated);
      // Try to restore the room image from IndexedDB
      const roomImg = await loadRoomImage();
      if (roomImg) {
        const parsed = parseDataUrl(roomImg);
        if (parsed) {
          setUploadedImage({
            dataUrl: roomImg,
            base64: parsed.base64,
            mimeType: parsed.mimeType,
            fileName: 'room.jpg',
          });
        }
      }
      setAppState(AppState.LOOKBOOK);
    }
  }, [parseDataUrl]);

  const errorInfo = error ? getErrorMessage(error.code) : null;
  const errorTitle = error?.title ?? errorInfo?.title ?? 'Something Went Wrong';
  const errorMessage = error?.message ?? errorInfo?.description ?? '';
  const errorSuggestion = error?.suggestion ?? errorInfo?.suggestion;
  const isNetworkError = ['NETWORK_ERROR', 'NETWORK_OFFLINE', 'NETWORK_TIMEOUT'].includes(error?.code ?? '');

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <header
        className={`bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-50 transition-colors duration-300 ${appState === AppState.DESIGN_STUDIO ? 'hidden' : ''}`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={resetApp}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-800 p-1 flex-shrink-0"
            aria-label={t('nav.returnHome')}
          >
            <img src="/room-logo-dark.png" alt="Room" style={{ height: 28 }} className="dark:hidden" /><img src="/room-logo.png" alt="Room" style={{ height: 28 }} className="hidden dark:block" />
          </button>

          {/* Desktop Navigation (sm and above) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-3 flex-shrink min-w-0">
            {/* Network Status - desktop only */}
            <NetworkStatus showIndicator={true} />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Back / Start Over — shown in sub-flows */}
            {(appState === AppState.MODE_SELECT || appState === AppState.STRUCTURE_ASSESSMENT || appState === AppState.DESIGN_OPTIONS || appState === AppState.LOOKBOOK || appState === AppState.RESULTS) && (
              <button
                onClick={resetApp}
                className="text-sm text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-800 px-2 sm:px-3 py-2 whitespace-nowrap"
                aria-label={t('nav.startOver')}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{(t as any)('app.button.new')}</span>
              </button>
            )}

            {/* Discover */}
            {(appState === AppState.HOME || appState === AppState.RESULTS || appState === AppState.MODE_SELECT || appState === AppState.LOOKBOOK) && (
              <button
                onClick={() => setAppState(AppState.DISCOVER)}
                className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                title={t('nav.discover')}
              >
                <Palette className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">{(t as any)('app.button.discover')}</span>
              </button>
            )}

            {/* My Rooms */}
            {(appState === AppState.HOME || appState === AppState.RESULTS || appState === AppState.MODE_SELECT || appState === AppState.LOOKBOOK) && (
              <button
                onClick={() => setAppState(AppState.ROOMS)}
                className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                title={t('nav.myRooms')}
              >
                <Home className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">{(t as any)('app.button.rooms')}</span>
              </button>
            )}

            {/* Projects */}
            {(appState === AppState.HOME || appState === AppState.ROOMS || appState === AppState.RESULTS) && (
              <button
                onClick={() => {
                  if (!canCreateProject(userTier)) {
                    setShowUpgradePrompt('project');
                    return;
                  }
                  setAppState(AppState.PROJECTS);
                }}
                className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                title={t('nav.projects')}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">{(t as any)('app.button.projects')}</span>
              </button>
            )}

            {/* Save Room — only on results with a design selected */}
            {appState === AppState.RESULTS && designAnalysis && selectedDesignIndex !== null && uploadedImage && (
              <button
                onClick={handleSaveRoom}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  currentRoomId
                    ? 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
                title={currentRoomId ? 'Update Room' : 'Save Room'}
              >
                <Home className="w-4 h-4" />
                <span className="hidden lg:inline">{currentRoomId ? (t as any)('app.button.saved') : (t as any)('app.button.save')}</span>
              </button>
            )}

            {/* Session Manager + Share — results only */}
            {appState === AppState.RESULTS && (
              <>
                <Suspense fallback={null}>
                  <SessionManager
                    currentSessionId={currentSessionId}
                    onLoadSession={handleLoadSession}
                    onSaveSession={handleSaveSession}
                    hasUnsavedChanges={!!analysis}
                  />
                </Suspense>
                {analysis && (
                  <Suspense fallback={null}>
                    <ShareButton
                      analysis={analysis.rawText}
                      roomType="room"
                    />
                  </Suspense>
                )}
              </>
            )}

            <UserMenu onOpenPricing={() => setShowPricing(true)} onOpenAuth={() => setShowAuthGate(true)} />
          </div>

          {/* Mobile Hamburger Menu Button (below sm) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/50 z-[60] sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-stone-800 z-[70] sm:hidden shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
                <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  aria-label={t('nav.close')}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {/* Back / Start Over */}
                  {(appState === AppState.MODE_SELECT || appState === AppState.STRUCTURE_ASSESSMENT || appState === AppState.DESIGN_OPTIONS || appState === AppState.LOOKBOOK || appState === AppState.RESULTS) && (
                    <button
                      onClick={() => { resetApp(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>{(t as any)('app.button.new')}</span>
                    </button>
                  )}

                  {/* Discover */}
                  {(appState === AppState.HOME || appState === AppState.RESULTS || appState === AppState.MODE_SELECT || appState === AppState.LOOKBOOK) && (
                    <button
                      onClick={() => { setAppState(AppState.DISCOVER); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <Palette className="w-5 h-5" />
                      <span>{(t as any)('app.button.discover')}</span>
                    </button>
                  )}

                  {/* My Rooms */}
                  {(appState === AppState.HOME || appState === AppState.RESULTS || appState === AppState.MODE_SELECT || appState === AppState.LOOKBOOK) && (
                    <button
                      onClick={() => { setAppState(AppState.ROOMS); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      <span>{(t as any)('app.button.rooms')}</span>
                    </button>
                  )}

                  {/* Projects */}
                  {(appState === AppState.HOME || appState === AppState.ROOMS || appState === AppState.RESULTS) && (
                    <button
                      onClick={() => {
                        if (!canCreateProject(userTier)) {
                          setShowUpgradePrompt('project');
                          setMobileMenuOpen(false);
                          return;
                        }
                        setAppState(AppState.PROJECTS);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <FolderOpen className="w-5 h-5" />
                      <span>{(t as any)('app.button.projects')}</span>
                    </button>
                  )}

                  {/* Save Room */}
                  {appState === AppState.RESULTS && designAnalysis && selectedDesignIndex !== null && uploadedImage && (
                    <button
                      onClick={() => { handleSaveRoom(); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        currentRoomId
                          ? 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                          : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      }`}
                    >
                      <Home className="w-5 h-5" />
                      <span>{currentRoomId ? (t as any)('app.button.saved') : (t as any)('app.button.save')}</span>
                    </button>
                  )}

                  {/* Divider */}
                  <div className="my-4 border-t border-stone-200 dark:border-stone-700" />

                  {/* Language Switcher */}
                  <div className="px-4 py-2">
                    <LanguageSwitcher />
                  </div>

                  {/* Theme Toggle */}
                  <div className="px-4 py-2">
                    <ThemeToggle />
                  </div>

                  {/* Network Status */}
                  <div className="px-4 py-2">
                    <NetworkStatus showIndicator={true} />
                  </div>

                  {/* User Pro Badge / Menu at bottom */}
                  <div className="mt-4 px-4">
                    <UserMenu onOpenPricing={() => { setShowPricing(true); setMobileMenuOpen(false); }} onOpenAuth={() => { setShowAuthGate(true); setMobileMenuOpen(false); }} />
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Rate Limit Toast */}
      {rateLimitMessage && (
        <div 
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300"
          role="alert"
        >
          <div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-4 py-3 shadow-lg flex items-center gap-3">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{rateLimitMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main 
        id="main-content"
        className={`flex-1 w-full ${appState === AppState.DESIGN_STUDIO ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}
        role="main"
      >
        
        {/* Home State */}
        {appState === AppState.HOME && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ paddingTop: 30 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 text-center mb-6 font-serif">
              <span dangerouslySetInnerHTML={{ __html: (t as any)('app.hero.title') }} />
            </h1>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 text-center max-w-xl mb-4 leading-relaxed" style={{ textWrap: 'balance' }}>
              {(t as any)('app.hero.description')}
            </p>

            {/* Free tier nudge */}
            {userTier.tier === 'free' && (
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-8">
                {userTier.generationsUsed === 0
                  ? (t as any)('app.hero.tryFree')
                  : (t as any)('app.hero.freeRemaining').replace('{count}', Math.max(0, userTier.generationsLimit - userTier.generationsUsed)).replace('{limit}', userTier.generationsLimit)}
              </p>
            )}
            {userTier.tier === 'pro' && (
              <p className="text-sm text-emerald-500 dark:text-emerald-400 mb-8">
                {(t as any)('app.hero.proRemaining').replace('{count}', userTier.generationsLimit - userTier.generationsUsed)}
              </p>
            )}

            <DesignCounter />

            <UploadZone onImageSelected={handleImageSelected} isAnalyzing={isAnalyzing} />
            
            {hasSavedLookbook && (
              <button
                onClick={handleResumeLookbook}
                className="mt-6 px-6 py-3 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4 text-emerald-500" />
                {(t as any)('app.hero.resumeLookbook')}
              </button>
            )}
            <TrendingStyles onOpenDiscover={() => setAppState(AppState.DISCOVER)} />

            <div className="mt-16 grid grid-cols-2 gap-10 sm:gap-16 text-center max-w-md">
              {[
                { icon: Camera, title: (t as any)('app.step.snap'), desc: (t as any)('app.step.snapDesc'), color: 'text-emerald-500' },
                { icon: Wand2, title: (t as any)('app.step.transform'), desc: (t as any)('app.step.transformDesc'), color: 'text-amber-500' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="font-bold text-sm text-stone-800 dark:text-stone-200 tracking-wide uppercase">{title}</div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyzing State - Enhanced with stage indicators */}
        {appState === AppState.ANALYZING && (
          <div 
            className="flex flex-col items-center justify-center min-h-[60vh]"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <AnalysisLoading 
              stage={analysisStage}
              progress={analysisProgress}
              className="max-w-md"
            />
          </div>
        )}

        {/* Mode Selection State */}
        {appState === AppState.MODE_SELECT && (
          <ErrorBoundary>
            <ModeSelect
              onSelectMode={handleModeSelect}
              uploadedImage={uploadedImage?.dataUrl ?? null}
            />
          </ErrorBoundary>
        )}

        {/* Structure Assessment State */}
        {appState === AppState.STRUCTURE_ASSESSMENT && structureDetection && (
          <ErrorBoundary>
            <Suspense fallback={<AnalysisLoading stage="processing" />}>
              <StructureAssessment
                elements={structureDetection.elements}
                onContinue={handleStructureChoices}
                disabled={isDetectingStructure}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Design Options State (V2 — 3 cards) */}
        {appState === AppState.DESIGN_OPTIONS && designAnalysis && (
          <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><AnalysisLoading stage="generating" progress={95} className="max-w-md" /></div>}>
            <DesignOptionsView
              roomReading={designAnalysis.roomReading}
              options={designAnalysis.options}
              onSelectDesign={handleSelectDesign}
              isGeneratingVisuals={isGeneratingVisuals}
            />
          </Suspense>
          </ErrorBoundary>
        )}

        {/* Lookbook State */}
        {appState === AppState.LOOKBOOK && (
          <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><AnalysisLoading stage="generating" progress={95} className="max-w-md" /></div>}>
            <Lookbook
              entries={lookbookEntries}
              onRate={handleRate}
              onSelectForIteration={handleSelectForIteration}
              onGenerateMore={handleGenerateMore}
              isGenerating={isGeneratingVisuals}
              uploadedImageUrl={uploadedImage?.dataUrl || null}
            />
          </Suspense>
          </ErrorBoundary>
        )}

        {/* Design Studio State */}
        {appState === AppState.DESIGN_STUDIO && studioEntry && (
          <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><AnalysisLoading stage="generating" progress={95} className="max-w-md" /></div>}>
            <DesignStudio
              entry={studioEntry}
              onBack={() => setAppState(AppState.LOOKBOOK)}
              sourceImage={uploadedImage ? { base64: uploadedImage.base64, mimeType: uploadedImage.mimeType } : undefined}
              onIterate={async (prompt: string) => {
                if (!uploadedImage || !studioEntry) return;
                const newDesign = await iterateDesign(
                  uploadedImage.base64,
                  uploadedImage.mimeType,
                  studioEntry.option,
                  prompt
                );
                const updatedEntry = { ...studioEntry, option: newDesign, generatedAt: Date.now() };
                setStudioEntry(updatedEntry);
                // Also update in lookbook entries
                setLookbookEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
              }}
            />
          </Suspense>
          </ErrorBoundary>
        )}

        {/* Rooms State */}
        {appState === AppState.ROOMS && (
          <ErrorBoundary>
          <Suspense fallback={null}>
            <RoomManager
              onAddRoom={resetApp}
              onOpenDesign={(entry, _room) => {
                setStudioEntry(entry);
                setAppState(AppState.DESIGN_STUDIO);
              }}
              onBack={() => setAppState(AppState.HOME)}
            />
          </Suspense>
          </ErrorBoundary>
        )}

        {/* Projects State */}
        {appState === AppState.PROJECTS && (
          <ErrorBoundary>
          <Suspense fallback={null}>
            <ProjectManager
              onBack={() => setAppState(AppState.HOME)}
              onOpenRoom={(_roomId) => {
                setAppState(AppState.ROOMS);
              }}
            />
          </Suspense>
          </ErrorBoundary>
        )}

        {/* Discover State */}
        {appState === AppState.DISCOVER && (
          <ErrorBoundary>
          <Suspense fallback={null}>
            <DiscoverPage
              onBack={() => setAppState(AppState.HOME)}
              onShowUpgrade={(feature) => setShowUpgradePrompt(feature)}
            />
          </Suspense>
          </ErrorBoundary>
        )}

        {/* Error State */}
        {appState === AppState.ERROR && error && (
          <div 
            className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center"
            role="alert"
            aria-live="assertive"
          >
            <div className="bg-red-50 dark:bg-red-900/30 p-4 mb-6">
              {isNetworkError ? (
                <WifiOff className="w-12 h-12 text-red-500 dark:text-red-400" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" aria-hidden="true" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">
              {errorTitle}
            </h2>
            
            <p className="text-stone-600 dark:text-stone-400 mb-8 leading-relaxed">
              {errorMessage}
            </p>

            {errorSuggestion && (
              <p className="text-stone-500 dark:text-stone-400 mb-8 text-sm">
                {errorSuggestion}
              </p>
            )}
            
            {error.code === 'API_KEY_MISSING' ? (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-4 text-sm text-amber-800 dark:text-amber-200 mb-6">
                <p className="font-medium mb-2">For Developers:</p>
                <p>Add <code className="bg-amber-100 dark:bg-amber-800/50 px-1">GEMINI_API_KEY</code> to your environment variables.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                {error.isRetryable && (
                  <button 
                    onClick={handleRetry}
                    className="bg-emerald-600 text-white px-6 py-3 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
                    aria-label={t('app.retryAnalysis')}
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    {(t as any)('app.button.tryAgain')}
                  </button>
                )}
                <button
                  onClick={resetApp}
                  className="bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 px-6 py-3 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
                  aria-label={t('app.goHome')}
                >
                  {(t as any)('app.button.startFresh')}
                </button>
              </div>
            )}
            
            {/* Error code for debugging */}
            <p className="mt-8 text-xs text-stone-400 dark:text-stone-500">
              {(t as any)('app.error.errorCode').replace('{code}', error.code)}
            </p>
          </div>
        )}

        {/* Results State */}
        {appState === AppState.RESULTS && analysis && (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><AnalysisLoading stage="generating" progress={95} className="max-w-md" /></div>}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
              {/* Left Column: Image & Analysis */}
              <div className="lg:col-span-7 space-y-8">
                {/* Back to designs button when in design flow */}
                {designAnalysis && (
                  <button
                    onClick={handleBackToOptions}
                    className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" /> {(t as any)('app.backToDesigns')}
                  </button>
                )}
                {/* Image Preview Card */}
                <div className="bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden p-2 transition-colors duration-300">
                  {uploadedImage?.dataUrl ? (
                    <img 
                      src={uploadedImage.dataUrl} 
                      alt="Your uploaded room photo" 
                      className="w-full h-64 md:h-80 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-80 bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-300 text-sm">
                      {(t as any)('app.error.originalNotAvailable')}
                    </div>
                  )}
                </div>
                
                {/* Analysis Results & Visualization */}
                <ErrorBoundary>
                <AnalysisDisplay 
                  analysis={analysis.rawText} 
                  products={analysis.products}
                  visualizationImage={visualizationImage}
                  onVisualize={handleVisualize}
                  isVisualizing={isVisualizing}
                  visualizationError={visualizationError}
                  onRetryVisualization={handleVisualize}
                  originalImage={uploadedImage?.dataUrl}
                  shoppingList={shoppingList}
                  sessionId={currentSessionId}
                />
                </ErrorBoundary>
              </div>

              {/* Right Column: Chat */}
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-24">
                  <ErrorBoundary>
                  <ChatInterface 
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isTyping={isChatTyping}
                  />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </Suspense>
        )}
      </main>

      {/* Footer */}
      {(appState === AppState.HOME || appState === AppState.MODE_SELECT) && (
        <footer className="border-t border-stone-200 dark:border-stone-800 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 dark:text-stone-500">
            <p>{(t as any)('app.footer.copyright').replace('{year}', new Date().getFullYear())}</p>
            <p>{(t as any)('app.footer.tagline')}</p>
          </div>
        </footer>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <Suspense fallback={null}>
          <UpgradePrompt
            message={getGateMessage(showUpgradePrompt)}
            onUpgrade={() => { setShowUpgradePrompt(null); setShowPricing(true); }}
            onDismiss={() => setShowUpgradePrompt(null)}
            onSignIn={() => { setShowUpgradePrompt(null); setShowAuthGate(true); }}
          />
        </Suspense>
      )}

      {/* Pricing Page Modal */}
      {showPricing && (
        <ErrorBoundary>
        <Suspense fallback={null}>
          <PricingPage
            onClose={() => setShowPricing(false)}
            onNeedAuth={() => { setShowPricing(false); setShowAuthGate(true); }}
          />
        </Suspense>
        </ErrorBoundary>
      )}

      {/* Auth Gate Modal */}
      {showAuthGate && (
        <Suspense fallback={null}>
          <AuthGate
            onClose={() => setShowAuthGate(false)}
            message="Sign in to upgrade to Pro"
          />
        </Suspense>
      )}

      {/* My Rooms Gallery Modal */}
      <ErrorBoundary>
      <Suspense fallback={null}>
        <MyRoomsGallery
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onLoadRoom={handleLoadRoom}
        />
      </Suspense>
      </ErrorBoundary>
    </div>
  );
}

/**
 * Main App component with all production enhancements
 */
export default function App() {
  // Handle /share/:id routes for public design links
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const shareMatch = path.match(/^\/share\/(.+)$/);
  
  if (shareMatch) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading...</div></div>}>
          <SharePage shareId={shareMatch[1]!} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AccessibilityProvider>
          <SkipNavigation />
          <AppContent />
          <AccessibilityToolbar />
        </AccessibilityProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
