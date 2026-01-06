import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
    KeyboardAvoidingView, Platform, Keyboard, Alert, Vibration, Image, ActivityIndicator,
    Animated, Easing, PanResponder, PixelRatio, Modal, LayoutAnimation, UIManager
} from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Mic, Bot, User, MoreVertical, Check, CheckCheck, Brain, Zap, ChevronDown, ChevronUp, Plus, Trash2, Sparkles, Tag } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

import apiService from '../services/api';
import socketService from '../services/socket';

// Standard Animated Message Bubble Wrapper
// Animates ALL new messages (sent or received) with a smooth slide-up + fade effect
const AnimatedMessageWrapper = ({ children, isFromMe, isNew = false }) => {
    const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
    const translateY = useRef(new Animated.Value(isNew ? 20 : 0)).current;
    const scaleAnim = useRef(new Animated.Value(isNew ? 0.95 : 1)).current;

    useEffect(() => {
        // Animate if this is a new message (either sent or received)
        if (isNew) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    damping: 18,
                    stiffness: 180,
                    mass: 0.8,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    damping: 15,
                    stiffness: 200,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [isNew]);

    return (
        <Animated.View style={{
            opacity: fadeAnim,
            transform: [
                { translateY },
                { scale: scaleAnim }
            ]
        }}>
            {children}
        </Animated.View>
    );
};

// Standard Animated Status Text
const AnimatedStatusText = ({ text }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [text]);

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.statusText}>{text}</Text>
        </Animated.View>
    );
};

// --- NEW PERFORMANCE ANIMATION COMPONENT ---
// --- PREMIUM AI TRANSITION OVERLAY ---
const AITransitionOverlay = ({ visible, statusText, mode }) => {
    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current; // Main container opacity
    const blurIntensity = useRef(new Animated.Value(0)).current; // Blur intensity
    const meshMove = useRef(new Animated.Value(0)).current; // Mesh gradient movement
    const saturation = useRef(new Animated.Value(1)).current; // Saturation for exit

    // Sparkle Scales (Independent pulsing)
    const s1 = useRef(new Animated.Value(0)).current;
    const s2 = useRef(new Animated.Value(0)).current;
    const s3 = useRef(new Animated.Value(0)).current;
    const s4 = useRef(new Animated.Value(0)).current; // Extra sparkle

    useEffect(() => {
        if (visible) {
            // --- ENTRANCE (ACTIVATION) ---

            // 1. Reset Values for Entry
            saturation.setValue(1);

            // 2. Parallel Entrance Animations
            Animated.parallel([
                // Fade In Container
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                // Increase Blur (Simulated via opacity of blur layer for performance)
                Animated.timing(blurIntensity, { toValue: 1, duration: 600, useNativeDriver: true }),
            ]).start();

            // 3. Start Mesh Movement Loop
            Animated.loop(
                Animated.sequence([
                    Animated.timing(meshMove, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(meshMove, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ])
            ).start();

            // 4. Sparkle Entrance & Pulsing (Staggered)
            const pulseSparkle = (anim, delay) => {
                // Initial pop in
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.spring(anim, { toValue: 1, friction: 4, useNativeDriver: true }), // Pop In
                    // Infinite Pulse Loop
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(anim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
                            Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true })
                        ])
                    )
                ]).start();
            };

            pulseSparkle(s1, 100);
            pulseSparkle(s2, 400);
            pulseSparkle(s3, 700);
            pulseSparkle(s4, 900);

        } else {
            // --- EXIT (DEACTIVATION) ---
            // "Dissipation" effect

            Animated.parallel([
                // 1. Fade Out Container
                Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                // 2. Remove Blur
                Animated.timing(blurIntensity, { toValue: 0, duration: 400, useNativeDriver: true }),
                // 3. Shrink Sparkles to 0 (Evaporation)
                Animated.timing(s1, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(s2, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(s3, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(s4, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => {
                // Reset mesh loop implies stopping updates, effectively handled by unmounting or visibility toggle
                meshMove.setValue(0);
            });
        }
    }, [visible]);

    if (!visible && fadeAnim._value === 0) return null;

    // Interpolations for Organic Mesh Movement
    const blob1Style = {
        transform: [
            { translateX: meshMove.interpolate({ inputRange: [0, 1], outputRange: [-50, 50] }) },
            { translateY: meshMove.interpolate({ inputRange: [0, 1], outputRange: [-30, 80] }) },
            { scale: meshMove.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }
        ]
    };

    const blob2Style = {
        transform: [
            { translateX: meshMove.interpolate({ inputRange: [0, 1], outputRange: [40, -40] }) },
            { translateY: meshMove.interpolate({ inputRange: [0, 1], outputRange: [50, -20] }) },
            { scale: meshMove.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.9] }) }
        ]
    };

    return (
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 9999, opacity: fadeAnim }]}>
            {/* Dark Backdrop */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#09090b' }]}>
                {/* Organic Mesh Blobs */}
                <Animated.View style={[blob1Style, {
                    position: 'absolute', width: 400, height: 400, borderRadius: 200,
                    backgroundColor: 'rgba(139, 92, 246, 0.5)', top: '-10%', left: '-20%', // Purple
                }]} />
                <Animated.View style={[blob2Style, {
                    position: 'absolute', width: 350, height: 350, borderRadius: 175,
                    backgroundColor: 'rgba(37, 99, 235, 0.4)', bottom: '10%', right: '-10%', // Blue
                }]} />
            </View>

            {/* Glassmorphism Plane */}
            <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

                    {/* Floating Sparkles (Constellation) */}
                    <Animated.View style={{ position: 'absolute', top: '30%', left: '20%', transform: [{ scale: s1 }] }}>
                        <Sparkles size={28} color="#c4b5fd" fill="#c4b5fd" />
                    </Animated.View>
                    <Animated.View style={{ position: 'absolute', bottom: '35%', right: '15%', transform: [{ scale: s2 }] }}>
                        <Sparkles size={36} color="#8b5cf6" fill="#8b5cf6" />
                    </Animated.View>
                    <Animated.View style={{ position: 'absolute', top: '40%', right: '25%', transform: [{ scale: s3 }] }}>
                        <Sparkles size={20} color="#60a5fa" fill="#60a5fa" />
                    </Animated.View>
                    <Animated.View style={{ position: 'absolute', bottom: '25%', left: '30%', transform: [{ scale: s4 }] }}>
                        <Zap size={24} color="#a78bfa" fill="#a78bfa" />
                    </Animated.View>

                    {/* Central Brain Icon with Pulse */}
                    <Animated.View style={{
                        transform: [{ scale: meshMove.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
                        shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 30
                    }}>
                        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                            <Brain size={64} color="#fff" />
                        </View>
                    </Animated.View>

                    {/* Status Text with Spacing */}
                    <Text style={{
                        color: '#fff', marginTop: 40, fontSize: 16, fontWeight: '800',
                        letterSpacing: 4, textAlign: 'center', paddingHorizontal: 40,
                        textTransform: 'uppercase', textShadowColor: 'rgba(139, 92, 246, 0.5)', textShadowRadius: 10
                    }}>
                        {statusText}
                    </Text>

                    <View style={{ marginTop: 20 }}>
                        <ActivityIndicator color="#fff" size="small" />
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

// Enable LayoutAnimation on Android


const ChatDetailScreen = ({ route, navigation }) => {
    const { chatId, chatJid, sessionId, name, profilePicture } = route.params;
    const [messages, setMessages] = useState([]);
    const [lastSeen, setLastSeen] = useState(null);
    const [showTransition, setShowTransition] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [cost, setCost] = useState(0); // Cost State
    const [presence, setPresence] = useState({ status: 'offline', lastSeen: null }); // Presence State
    const [isInputFocused, setIsInputFocused] = useState(false); // Input Focus State

    // AI & Control State
    const [controlMode, setControlMode] = useState(null); // null = loading, 'ai' or 'human' = loaded
    const [modeLoading, setModeLoading] = useState(true);
    const [aiThinking, setAiThinking] = useState(false);
    const [aiStatusText, setAiStatusText] = useState('PILOTO AUTOMÁTICO ATIVO');
    const [expandedThoughts, setExpandedThoughts] = useState({});

    // Media State
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // Tags State
    const [tags, setTags] = useState([]);

    // Campaign & Lead Status State
    const [campaignName, setCampaignName] = useState(null);
    const [leadStatus, setLeadStatus] = useState(null);

    // AI Thinking Ref for Performance (Avoids Stale Closures in Socket)
    const aiThinkingRef = useRef(false);

    // Removed global LayoutAnimation to prevent "pulsing" side effects on the Toggle Bar.
    // We will rely on local Animated API for smooth text appearance.

    const toggleThought = (msgId) => {
        setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }));
    };

    // --- ROBUST REF-BASED MODE TRACKING ---
    const activeModeRef = useRef(controlMode);

    // Sync ref when external state changes (e.g., from sockets)
    useEffect(() => {
        activeModeRef.current = controlMode;
    }, [controlMode]);

    // Toggle Lead Owner (Auto/Human)
    const handleToggleMode = async () => {
        // 1. Calculate NEW mode based on the REF (Source of Truth)
        const currentRefMode = activeModeRef.current;

        // Skip if mode is still loading
        if (currentRefMode === null) return;

        const newMode = currentRefMode === 'ai' ? 'human' : 'ai';

        // 2. Update Ref IMMEDIATELY
        activeModeRef.current = newMode;
        setControlMode(newMode);

        // --- OPTIMISTIC MESSAGE UNLOCK (INSTANT FEEDBACK) ---
        // Try to guess agent name from history for instant display
        const lastAgentMsg = [...messages].reverse().find(m => m.is_ai && m.agent_name);
        let agentName = lastAgentMsg ? lastAgentMsg.agent_name : 'IA';

        // We will refine 'agentName' later with async calls, but for now use the guess
        const systemBody = newMode === 'ai'
            ? `O agente ${agentName} está assumindo a conversa`
            : "Você assumiu o controle";

        const tempId = `temp_system_${Date.now()}`;
        const timestamp = new Date().toISOString();

        // 3. SHOW MESSAGE INSTANTLY
        const optimisticMessage = {
            id: tempId,
            message_id: tempId,
            chat_id: chatId,
            system_action: systemBody,
            from_me: true,
            timestamp: timestamp,
            is_ai: newMode === 'ai',
            agent_name: newMode === 'ai' ? agentName : 'Humano',
            lead_id: route.params?.leadId || null, // Best guess leadID
            type: 'system'
        };
        setMessages(prev => [optimisticMessage, ...prev]);

        // Scroll to bottom (visual) immediately
        setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 50);

        const phone = chatJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');

        if (newMode === 'ai') {
            // --- ACTIVATION PHASE ---
            setAiStatusText("INICIANDO CONEXÃO...");
            setShowTransition(true);

            // Sequential Fetch for Display Name (Background)
            try {
                // 1. Get Campaign ID
                const { data: leadData } = await apiService.supabase
                    .from('campaign_leads')
                    .select('campaign_id')
                    .or(`phone.eq.${phone},phone.ilike.%${phone.slice(-8)}`)
                    .maybeSingle();

                if (leadData?.campaign_id) {
                    // 2. Get Agent ID
                    const { data: campData } = await apiService.supabase
                        .from('campaigns')
                        .select('agent_id')
                        .eq('id', leadData.campaign_id)
                        .single();

                    if (campData?.agent_id) {
                        // 3. Get Agent Name
                        const { data: agentData } = await apiService.supabase
                            .from('agents')
                            .select('name')
                            .eq('id', campData.agent_id)
                            .single();

                        if (agentData?.name) {
                            agentName = agentData.name;
                        }
                    }
                }
            } catch (err) {
                console.warn('[System] Name fetch warning:', err);
            }

            // setControlMode('ai'); // Already set above
        } else {
            // --- DEACTIVATION PHASE ---
            // setControlMode('human'); // Already set above
        }



        try {
            const phone = chatJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
            const cleanPhone = phone.replace(/\D/g, '');

            // 1. Robust Lead/Agent Name Lookup
            let agentName = 'AI';
            let leadId = route.params?.leadId || null;

            // Validate UUID to avoid Supabase errors (prevent passing "null" string)
            const isValidUUID = (uuid) => uuid && uuid !== 'null' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
            const leadQuery = isValidUUID(leadId) ? `id.eq.${leadId},` : '';

            const { data: leadData, error: lookupError } = await apiService.supabase
                .from('campaign_leads')
                .select('id, campaign_id, campaigns(agent_id, agents(name))')
                .or(`${leadQuery}phone.eq.${phone},phone.eq.${cleanPhone},phone.ilike.%${cleanPhone.slice(-8)}`)
                .maybeSingle();

            if (lookupError) {
                console.warn('[System] Lookup error:', lookupError.message);
            }

            if (leadData) {
                leadId = leadData.id;
                // Double check if we got a name from the join
                const foundName = leadData.campaigns?.agents?.name || leadData.campaigns?.agent?.name;

                if (foundName) {
                    agentName = foundName;
                } else if (leadData.campaigns?.agent_id) {
                    // Fallback: Fetch agent name directly if join failed
                    const { data: agentData } = await apiService.supabase
                        .from('agents')
                        .select('name')
                        .eq('id', leadData.campaigns.agent_id)
                        .single();

                    if (agentData?.name) {
                        agentName = agentData.name;
                    }
                }
                console.log(`[System] Resolved Agent: ${agentName} (Lead ID: ${leadId})`);
            } else {
                console.log('[System] Lead not found for phone:', phone);
            }

            // 2. Update Lead Owner in Supabase
            if (leadId) {
                const { error: updateError } = await apiService.supabase
                    .from('campaign_leads')
                    .update({ owner: newMode })
                    .eq('id', leadId);
                if (updateError) throw updateError;

                // FORCE AI TRIGGER if switching TO AI
                // This ensures the AI reacts "NA HORA" (immediately) instead of waiting for cron/loop
                if (newMode === 'ai') {
                    console.log('[System] Triggering AI Immediate Action...');
                    apiService.triggerAi(leadId)
                        .then(() => console.log('[System] AI Triggered Successfully'))
                        .catch(err => console.warn('[System] Trigger Failed:', err));
                }
            } else {
                // Fallback to phone if no ID (for triage/unknown)
                await apiService.supabase
                    .from('campaign_leads')
                    .update({ owner: newMode })
                    .or(`phone.eq.${phone},phone.eq.${cleanPhone}`);
            }

            // Fetch current user if missing from params
            let effectiveUserId = route.params?.userId;
            if (!effectiveUserId) {
                const { data: { user } } = await apiService.supabase.auth.getUser();
                effectiveUserId = user?.id;
            }

            if (!effectiveUserId) {
                console.error('[System] Cannot toggle mode: Missing User ID');
                Alert.alert('Erro', 'Usuário não identificado via autenticação.');
                return;
            }

            // 3. Resolve Real Chat UUID for DB Insert
            let realChatId = chatId;

            // If we are using a temporary "lead-" ID, we DO NOT create a chat row.
            // We use the leadId directly for the system message.
            if (chatId.toString().startsWith('lead-')) {
                console.log('[System] Operating in Lead Mode. Using lead_id:', leadId);
                // We leave realChatId as the lead-string (or null?)
                // The 'messages' table has 'lead_id' column, so we can link it there.
                // We set chat_id to NULL if it's not a real UUID, to avoid UUID syntax error.
                realChatId = null;
            } else if (!isValidUUID(chatId)) {
                // If it's a JID but not a UUID? usually chatId IS the UUID in this app's "Chat" mode.
                // But in "Lead" mode it is lead-ID.
                // If we are here, it might be some other string.
                realChatId = null;
            } else {
                // It is a valid UUID, so it's a real chat_id
                realChatId = chatId;
            }

            // For DB (Persist the message we already showed)
            const dbMessage = {
                chat_id: realChatId, // Can be NULL now
                user_id: effectiveUserId,
                message_id: tempId, // Reuse same ID
                // Update body if agentName changed during fetch? 
                // Creating a new string just to be safe if agentName was updated
                system_action: newMode === 'ai' ? `O agente ${agentName} está assumindo a conversa` : "Você assumiu o controle",
                from_me: true,
                timestamp: timestamp,
                is_ai: newMode === 'ai',
                agent_name: newMode === 'ai' ? agentName : 'Humano',
                lead_id: leadId, // CRITICAL: Link to Lead
                type: 'system'
            };


            // NO setMessages call here (done optimistically at top)

            // Also persist to DB
            console.log('[System] 💾 Saving mode switch message:', dbMessage);
            const { error: insertError } = await apiService.supabase.from('messages').insert(dbMessage);
            if (insertError) {
                console.error('[System] ❌ Failed to save mode switch message:', insertError);
            } else {
                console.log('[System] ✅ Mode switch message saved successfully');
            }

        } catch (error) {
            console.error('Error toggling mode:', error);
            setControlMode(controlMode); // Revert
            // Alert.alert('Erro', 'Falha ao alterar modo.');
        }
    };
    const flatListRef = useRef(null);
    const lastActivityRef = useRef(0); // Debounce ref for presence
    const lastProcessedIdRef = useRef(null);
    const newMessageIdsRef = useRef(new Set()); // Track new message IDs for entrance animation
    const insets = useSafeAreaInsets();

    // Pulsing animation for AI thinking
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const inputSlideAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden (slid down)
    const glowOpacityAnim = useRef(new Animated.Value(0)).current; // 0 = transparent, 1 = visible
    const blurOpacityAnim = useRef(new Animated.Value(0)).current; // 0 = transparent, 1 = visible (blurred)

    // Dynamic Padding Animation
    // Initial value based on current controlMode (though usually starts 'human')
    const paddingHeightAnim = useRef(new Animated.Value(controlMode === 'ai' ? 100 : 180)).current;

    useEffect(() => {
        if (aiThinking) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(0);
        }
    }, [aiThinking]);

    // Animate input slide and glow when switching modes
    useEffect(() => {
        // Skip animation if mode is still loading (null)
        if (controlMode === null) return;

        if (controlMode === 'ai') {
            // Slide input down + fade in glow
            Animated.parallel([
                Animated.timing(inputSlideAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(glowOpacityAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: false,
                }),
                // Animate Padding Shrink (Fast/Snappy)
                Animated.timing(paddingHeightAnim, {
                    toValue: 100, // Target for AI mode
                    duration: 250, // Faster duration (User requested "fast lightning")
                    easing: Easing.out(Easing.exp), // Sharp deceleration
                    useNativeDriver: false,
                })
            ]).start();
        } else {
            // Slide input up + fade out glow
            Animated.parallel([
                Animated.timing(inputSlideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(glowOpacityAnim, {
                    toValue: 0, // Fade out glow
                    duration: 300,
                    useNativeDriver: false,
                }),
                // Animate Padding Grow (Fast/Snappy)
                Animated.timing(paddingHeightAnim, {
                    toValue: 180, // Target for Human mode
                    duration: 250,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: false,
                })
            ]).start();
        }
    }, [controlMode]);

    // Animate Input Blur on Focus
    useEffect(() => {
        Animated.timing(blurOpacityAnim, {
            toValue: isInputFocused ? 1 : 0,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web', // View opacity usually supports native driver
        }).start();
    }, [isInputFocused]);

    useEffect(() => {
        // Initial load from DB
        fetchMessages(false);
        fetchControlMode();
        fetchPresence(); // Fetch initial presence

        // Connect Socket
        socketService.connect();

        // Socket.io Message Handler (Instant)
        const handleSocketMessage = (payload) => {
            // Sync absolute cost if provided (more robust than deltas)
            if (payload.chat?.total_cost !== undefined) {
                setCost(Number(payload.chat.total_cost).toFixed(4));
            }

            // Only process if it belongs to this chat
            const eventJid = apiService.normalizeJid(payload.chatJid || payload.chatId);
            const currentJid = apiService.normalizeJid(chatJid);
            const isUUIDMatch = payload.chatId === chatId;

            if (eventJid !== currentJid && !isUUIDMatch) return;

            console.log('[Socket] Incoming message:', payload.message?.id);

            // Haptic Feedback for incoming message
            if (Platform.OS !== 'web') Vibration.vibrate(10); // Light tap

            if (!payload.message) return;

            if (!payload.message) return;

            // REMOVED: Strict deduplication block to allow streaming updates (same ID, new content)
            // if (payload.message.id && lastProcessedIdRef.current === payload.message.id) return;
            // if (payload.message.id) lastProcessedIdRef.current = payload.message.id;

            // Direct check from backend payload OR Waha ID pattern (adapting to backend)
            // Robust isFromMe check (Camel, Snake, ID Pattern, JID Fallback)
            const msgFrom = apiService.normalizeJid(payload.message.from);
            const normalizedChatJid = apiService.normalizeJid(chatJid);

            const isFromMe = payload.message.fromMe ||
                payload.message.key?.fromMe ||
                payload.message.from_me || // Check snake_case too
                (payload.message.id && payload.message.id.toString().startsWith('true_')) ||
                (msgFrom && normalizedChatJid && msgFrom !== normalizedChatJid); // Fallback: If sender is NOT the chat partner, it's me (1v1)

            const newMsg = {
                id: payload.message.id || `sock-${Date.now()}`,
                body: payload.message.body,
                from_me: isFromMe,
                timestamp: payload.message.timestamp || new Date().toISOString(),
                status: isFromMe ? 'sent' : 'received',
                chat_id: chatId,
                ack: payload.message.ack || (isFromMe ? 1 : undefined),
                is_ai: payload.message.is_ai, // PASS IS_AI FLAG
                agent_name: payload.message.agent_name, // PASS AGENT NAME
                ai_thought: payload.message.ai_thought, // PASS THOUGHT
                is_task: payload.message.is_task,
                task_type: payload.message.task_type,
                task_id: payload.message.task_id
            };

            // --- AUTO-EXPAND AI THOUGHT (REAL-TIME SURGE) ---
            if (newMsg.ai_thought) {
                setExpandedThoughts(prev => {
                    // Only animate if NOT already open
                    if (!prev[newMsg.id]) {
                        LayoutAnimation.configureNext({
                            duration: 600, // Slightly longer for the "slow middle" feel
                            create: {
                                type: LayoutAnimation.Types.spring,
                                property: LayoutAnimation.Properties.scaleXY,
                                springDamping: 0.7, // Bouncy/Fast start, slows down
                            },
                            update: {
                                type: LayoutAnimation.Types.spring,
                                springDamping: 0.7,
                            },
                            delete: {
                                type: LayoutAnimation.Types.linear,
                                property: LayoutAnimation.Properties.opacity,
                                duration: 200
                            }
                        });
                        return { ...prev, [newMsg.id]: true };
                    }
                    return prev;
                });
            }

            // CRITICAL: Stop thinking animation if AI responded
            if (isFromMe || newMsg.is_ai || newMsg.ai_thought) {
                setAiThinking(false);
            }

            setMessages(prev => {
                // 1. Check if message exists (Update vs Insert)
                const existingIndex = prev.findIndex(m => m.id === newMsg.id || (m.chat_message_id && m.chat_message_id === newMsg.id));

                if (existingIndex !== -1) {
                    // MESSAGE EXISTS - UPDATE IT (Streaming Support)
                    const updatedMessages = [...prev];
                    const oldMsg = updatedMessages[existingIndex];

                    // Only update if content changed
                    if (oldMsg.body !== newMsg.body || oldMsg.ai_thought !== newMsg.ai_thought || oldMsg.status !== newMsg.status) {
                        updatedMessages[existingIndex] = { ...oldMsg, ...newMsg };
                        return updatedMessages;
                    }
                    return prev;
                }

                // 2. Optimistic Merge
                if (isFromMe) {
                    const tempMatchIndex = prev.findIndex(m =>
                        (m.id.toString().startsWith('temp-') || m.status === 'pending') &&
                        m.body === newMsg.body &&
                        (new Date() - new Date(m.timestamp) < 10000)
                    );

                    if (tempMatchIndex !== -1) {
                        const updated = [...prev];
                        updated[tempMatchIndex] = { ...updated[tempMatchIndex], ...newMsg, id: newMsg.id };
                        return updated;
                    }
                }

                // 3. New Message - Scroll and Add
                // Mark as new for entrance animation
                newMessageIdsRef.current.add(newMsg.id);
                // Clear animation flag after animation completes
                setTimeout(() => {
                    newMessageIdsRef.current.delete(newMsg.id);
                }, 500);

                setTimeout(() => {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }, 100);

                return [newMsg, ...prev];
            });
        };


        socketService.on('message', handleSocketMessage);

        // Socket.io AI Thinking Handler
        const handleAiThinking = (payload) => {
            // Debug Payload
            // console.log('[Socket] Raw Thinking Payload:', JSON.stringify(payload));

            console.log('[Socket] Checking against:', { sessionId, chatJid, chatId });

            // Check Session
            if (payload.sessionName && payload.sessionName !== sessionId) {
                console.log(`[Socket] Session Mismatch: ${payload.sessionName} !== ${sessionId}`);
                return;
            }

            // Check Chat logic: Support chatJid OR phone OR chatId matching
            const eventJid = apiService.normalizeJid(payload.chatJid || payload.phone || payload.chatId);
            const currentJid = apiService.normalizeJid(chatJid);

            // Check UUID match (strict) - Only if both are valid UUIDs
            const isUUIDMatch = payload.chatId === chatId;

            // Check JID match (normalized)
            const isJidMatch = eventJid && currentJid && eventJid === currentJid;

            // Special Case: If we are in a "Lead View" (lead-ID), we MUST rely on JID matching
            const isLeadView = chatId && chatId.toString().startsWith('lead-');

            if (isLeadView) {
                if (!isJidMatch) {
                    // If we are in lead view, and JID doesn't match, ignore. 
                    // (UUID match is impossible since one is lead-ID and other is UUID)
                    console.log(`[Socket] Chat Mismatch (Lead View): ${eventJid} !== ${currentJid}`);
                    return;
                }
            } else {
                // Normal View: Require either UUID or JID match
                if (!isJidMatch && !isUUIDMatch) {
                    console.log(`[Socket] Chat Mismatch: ${eventJid} !== ${currentJid} AND ${payload.chatId} !== ${chatId}`);
                    return;
                }
            }

            console.log('[Socket] AI Thinking Match! State:', payload.isThinking);

            // Only Animate if State Actually Changes (Start or Stop)
            // This prevents "choppy typing" by avoiding LayoutAnimation on every text token
            if (aiThinkingRef.current !== payload.isThinking) {
                animateSpring();
                aiThinkingRef.current = payload.isThinking;
                setAiThinking(payload.isThinking);

                // Auto-expand UI on START
                if (payload.isThinking) setThoughtExpanded(true);
            }

            // Dynamic Status Text & Pipeline Extraction (Web Parity)
            if (payload.isThinking) {
                let displayStatus = 'RACIOCINANDO...';

                if (payload.thought) {
                    // Web Logic: Extract Pipeline if present
                    if (payload.thought.includes('|')) {
                        const parts = payload.thought.split('|').map(p => p.trim());
                        displayStatus = parts[parts.length - 1]; // Show last step
                    } else if (payload.thought.includes('\n')) {
                        const lines = payload.thought.split('\n').filter(l => l.includes(':')).map(p => p.trim());
                        if (lines.length > 0) displayStatus = lines[lines.length - 1];
                        else displayStatus = payload.thought;
                    } else {
                        displayStatus = payload.thought;
                    }
                }

                setAiStatusText(displayStatus.toUpperCase());
                // Note: We do NOT call setThoughtExpanded(true) here repeatedly, 
                // to avoid re-triggering animation logic unnecessarily. 
                // It is handled in the "State Change" block above.
            } else {
                setAiStatusText('PILOTO AUTOMÁTICO ATIVO');
            }

            // Web Parity: Force AI control mode if thinking starts
            if (payload.isThinking) {
                setControlMode('ai');
                // Subtle Haptic Pulse for AI Activation
                if (Platform.OS !== 'web') Vibration.vibrate([0, 30, 0, 30]);
            }
        };



        const handleMessageAck = (payload) => {
            // Updated Payload: { ack: 3, messageId: "...", status: "read" }
            console.log('[Socket] ACK:', payload);

            setMessages(prev => prev.map(m => {
                const messageId = m.id;

                // Support both new (messageId) and old (MessageIDs) formats
                const isMatch = (payload.messageId && payload.messageId === messageId) ||
                    (payload.MessageIDs && payload.MessageIDs.includes(messageId)) ||
                    (payload.id && Array.isArray(payload.id) && payload.id.includes(messageId));

                if (isMatch) {
                    return { ...m, ack: payload.ack };
                }
                return m;
            }));
        };

        socketService.on('ai.thinking', handleAiThinking);
        const handleLeadUpdate = (payload) => {
            // Supports both leadId (web style) or chatId matches
            if ((payload.leadId && payload.leadId === route.params?.leadId) || payload.chatId === chatId) {
                console.log('[Socket] Lead Update:', payload);
                if (payload.status) setLeadStatus(payload.status);
                if (payload.tags) setTags(payload.tags);
                // Accumulate cost if provided (delta)
                if (payload.cost) setCost(prev => (parseFloat(prev || 0) + parseFloat(payload.cost)).toFixed(4));
            }
        };

        const handleDealUpdate = (payload) => {
            if (payload.leadId === route.params?.leadId) {
                console.log('[Socket] Deal Update:', payload);
            }
        };

        socketService.on('lead.update', handleLeadUpdate);
        socketService.on('deal.updated', handleDealUpdate);
        socketService.on('message.ack', handleMessageAck);

        return () => {
            console.log('[Socket] Cleaning up listeners');
            socketService.off('message', handleSocketMessage);
            socketService.off('ai.thinking', handleAiThinking);
            socketService.off('message.ack', handleMessageAck);
            socketService.off('lead.update', handleLeadUpdate);
            socketService.off('deal.updated', handleDealUpdate);
        };
    }, [chatId, sessionId, chatJid]);

    // Presence Listener
    useEffect(() => {
        const handlePresenceUpdate = (payload) => {
            if (payload.session && payload.session !== sessionId) return;

            // Check Chat Match
            const eventJid = apiService.normalizeJid(payload.chatId || payload.originalId);
            const currentJid = apiService.normalizeJid(chatJid);

            // Simple check: if the event update is for THIS chat
            if (eventJid === currentJid || payload.chatId === chatId) {
                const now = Date.now();

                if (payload.status === 'composing' || payload.status === 'recording') {
                    // User is typing or recording
                    lastActivityRef.current = now;
                    setPresence({ status: payload.status, lastSeen: null });
                } else if (payload.status === 'paused' || payload.status === 'online') {
                    // User stopped typing (paused) or is just online -> show "Online"
                    // Only update if not recently composing (debounce)
                    if (now - (lastActivityRef.current || 0) > 3000) {
                        setPresence(prev => ({ ...prev, status: 'online' }));
                    }
                } else if (payload.status === 'offline') {
                    // User went offline -> save and show lastSeen
                    const newLastSeen = payload.lastSeen || new Date().toISOString();
                    setPresence({ status: 'offline', lastSeen: newLastSeen });
                }
            }
        };

        socketService.on('presence.update', handlePresenceUpdate);
        return () => socketService.off('presence.update', handlePresenceUpdate);
    }, [chatId, sessionId, chatJid]);

    // Auto-scroll when lead starts typing
    useEffect(() => {
        if (presence.status === 'composing' || presence.status === 'recording') {
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
        }
    }, [presence.status]);

    // Enable LayoutAnimation for Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);

    // Smooth keyboard transition - Faster to match Android keyboard speed
    useEffect(() => {
        const onKeyboardChange = () => {
            LayoutAnimation.configureNext({
                duration: 180,
                update: {
                    type: LayoutAnimation.Types.easeInEaseOut,
                },
            });
        };

        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showListener = Keyboard.addListener(showEvent, onKeyboardChange);
        const hideListener = Keyboard.addListener(hideEvent, onKeyboardChange);

        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    // Recording Timer
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const fetchMessages = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [msgsData, tasksData, tagsData] = await Promise.all([
                apiService.getMessages(chatId),
                apiService.getLeadTasks(chatJid),
                apiService.getLeadTags(chatJid)
            ]);

            // Normalize tasks to look like messages for the list
            const formattedTasks = tasksData.map(t => ({
                id: `task-${t.id}`,
                type: 'task', // Custom type
                task_type: t.type, // meeting, payment_check, etc.
                body: t.description || `Tarefa: ${t.type}`,
                timestamp: t.created_at,
                status: t.status,
                from_me: true, // Show on right? or Center? usually tasks are system-like hence Center.
                is_task: true
            }));

            // Merge and Sort DESCENDING (Newest First)
            const combined = [...(msgsData || []), ...formattedTasks].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            setMessages(combined);
            setTags(tagsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchControlMode = async () => {
        try {
            const phone = chatJid.replace('@s.whatsapp.net', '');
            const { data, error } = await apiService.supabase
                .from('campaign_leads')
                .select('owner, id, status, campaigns(name)') // Added status and campaign name
                .eq('phone', phone)
                .single();

            if (data) {
                setControlMode(data.owner || 'human');
                setLeadStatus(data.status || null);
                setCampaignName(data.campaigns?.name || null);
                if (data.id) fetchCost(data.id); // Fetch cost using real Lead ID
            } else {
                setControlMode('human'); // Default if no lead found
            }
        } catch (error) {
            console.log('Error fetching control mode:', error);
            setControlMode('human'); // Default on error
        } finally {
            setModeLoading(false);
        }
    };

    const fetchCost = async (leadId) => {
        try {
            const data = await apiService.getLeadCost(leadId);
            if (data && data.total_cost) {
                setCost(data.total_cost);
            }
        } catch (error) {
            console.log('Error fetching cost:', error);
        }
    };

    const fetchPresence = async () => {
        try {
            // Try to get lastSeen from chats table using UUID first, then by chat_id (JID)
            let chatData = null;

            // Try by UUID
            const { data: byUuid } = await apiService.supabase
                .from('chats')
                .select('last_seen')
                .eq('id', chatId)
                .maybeSingle();

            if (byUuid?.last_seen) {
                chatData = byUuid;
            } else {
                // Fallback: Try by chat_id (JID)
                const { data: byJid } = await apiService.supabase
                    .from('chats')
                    .select('last_seen')
                    .eq('chat_id', chatJid)
                    .maybeSingle();
                chatData = byJid;
            }

            if (chatData?.last_seen) {
                // If we have a saved lastSeen, show it (user is currently offline)
                setPresence({ status: 'offline', lastSeen: chatData.last_seen });
            }
        } catch (error) {
            console.log('Error fetching presence:', error);
        }
    };


    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;

        const text = inputValue.trim();
        setInputValue('');
        setSending(true);

        // Optimistic update
        const tempMsg = {
            id: `temp-${Date.now()}`,
            body: text,
            from_me: true,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        setMessages(prev => [tempMsg, ...prev]);

        // Scroll to top (which is bottom in inverted list) after sending
        setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);

        try {
            await apiService.sendMessage(sessionId, chatJid, text);
            // Realtime subscription will handle the new message
            // No need to refresh and cause loading state
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        } finally {
            setSending(false);
        }
    };



    // --- Media Logic ---

    // Audio Recording
    async function startRecording() {
        try {
            if (permissionResponse.status !== 'granted') {
                console.log('Requesting permission..');
                await requestPermission();
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording..');
            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await newRecording.startAsync();
            setRecording(newRecording);
            setIsRecording(true);
            setRecordingDuration(0);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        console.log('Stopping recording..');
        setRecording(undefined);
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stored at', uri);

        // Send Voice
        if (uri) {
            sendVoiceMessage(uri);
        }
    }

    async function cancelRecording() {
        console.log('Cancelling recording..');
        setRecording(undefined);
        setIsRecording(false);
        if (recording) {
            await recording.stopAndUnloadAsync();
        }
        setRecordingDuration(0);
    }

    const sendVoiceMessage = async (uri) => {
        try {
            setSending(true);
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            const dataUri = `data:audio/m4a;base64,${base64}`; // Assuming m4a from Expo default

            // Optimistic Update (can be improved with a local 'audio' type message)
            const tempMsg = {
                id: `temp-${Date.now()}`,
                body: '🎤 Áudio enviado',
                type: 'ptt', // voice note
                from_me: true,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            setMessages(prev => [...prev, tempMsg]);

            await apiService.sendVoice(sessionId, chatJid, dataUri);
        } catch (error) {
            console.error('Error sending voice:', error);
            Alert.alert('Erro', 'Falha ao enviar áudio.');
        } finally {
            setSending(false);
        }
    };

    // Image Picker
    const pickImage = async () => {
        // Request permission if needed (Expo 10+ handles auto)
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: false, // Send full image
            quality: 0.5, // Reduced quality to avoid 413 errors temporarily
            base64: true
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            sendImageMessage(asset);
        }
    };

    const sendImageMessage = async (asset) => {
        try {
            setSending(true);
            const base64 = asset.base64; // Expo ImagePicker returns base64 if requested
            const dataUri = `data:${asset.mimeType || 'image/jpeg'};base64,${base64}`;

            // Optimistic
            const tempMsg = {
                id: `temp-${Date.now()}`,
                body: '📷 Imagem enviada',
                type: 'image',
                from_me: true,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            setMessages(prev => [...prev, tempMsg]);

            await apiService.sendImage(sessionId, chatJid, dataUri, '');
        } catch (error) {
            console.error('Error sending image:', error);
            Alert.alert('Erro', 'Falha ao enviar imagem.');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (text) => {
        if (!text) return '?';
        return text.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    // Helper to get status badge styling
    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
            'contacted': { label: 'Contatado', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
            'responded': { label: 'Respondeu', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
            'qualified': { label: 'Qualificado', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
            'converted': { label: 'Convertido', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
            'lost': { label: 'Perdido', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
            'junk': { label: 'Inválido', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
            'manual_intervention': { label: 'Manual', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
        };
        return statusMap[status] || { label: status || 'N/A', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)' };
    };

    // --- Magic UI Animations ---
    // --- Magic UI Animations (Reanimated) ---
    // --- Magic UI Animations (Standard Animated) ---
    // --- REMOVED OLD BORDER PULSE LOGIC ---
    // The user requested a bottom-up fading glow instead of a full border.
    // We will handle this in the render method with a LinearGradient overlay.


    const renderMessage = ({ item, index }) => {
        const isFromMe = item.from_me;
        const isAI = item.is_ai || item.ai_thought;
        const showTimestamp = index === 0 ||
            new Date(messages[index - 1]?.timestamp).getMinutes() !== new Date(item.timestamp).getMinutes();

        // Detect if this is a NEW message that should animate (sent OR received)
        const isTempMessage = item.id?.toString().startsWith('temp-');
        const isNewMessage = isTempMessage || newMessageIdsRef.current.has(item.id);
        // Message is pending if it has temp ID or status is 'pending'
        const isPending = isTempMessage || item.status === 'pending';

        // System Message (Mode Switch Indicator) OR Task Bubble
        if (item.type === 'system' || item.system_action || item.is_task) {
            let actionText = item.system_action || item.agent_name || item.body || '';

            // Formatting for Tasks
            if (item.is_task) {
                // Map common types to nice text if body is generic
                if (item.task_type === 'meeting' && !item.body) actionText = '📅 Reunião Agendada';
                if (item.task_type === 'payment_check' && !item.body) actionText = '💰 Verificar Pagamento';
                if (item.task_type === 'payment_confirmed' && !item.body) actionText = '✅ Pagamento Confirmado';
            }

            const isAIMode = typeof item.is_ai === 'boolean' ? item.is_ai : !actionText.startsWith('Você');

            return (
                <View style={{
                    alignSelf: 'center',
                    marginVertical: 12,
                    borderRadius: 20,
                    overflow: 'hidden', // Clip the glass layers
                    maxWidth: '85%', // Limit width for long tasks
                }}>
                    {/* 1. Underlying Blur Layer */}
                    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />

                    {/* 2. Unified Gradient Shine (Subtle Reflection) */}
                    <LinearGradient
                        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)', 'transparent']}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Content */}
                    <View style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center', // Center text since no icon
                        gap: 6
                    }}>
                        {/* No Icons, just text */}
                        <Text style={{
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: '600',
                            textAlign: 'center',
                            textShadowColor: 'rgba(0,0,0,0.3)',
                            textShadowRadius: 4
                        }}>
                            {actionText}
                        </Text>
                    </View>
                </View>
            );
        }

        // Logic for Visual Alignment (Standard: From Me = Right)
        // User requested: AI stays on RIGHT, but gets "Left User Shape" (handled in Bubble Style)

        return (
            <AnimatedMessageWrapper isFromMe={isFromMe} isNew={isNewMessage}>
                <View style={[
                    styles.messageContainer,
                    isFromMe ? styles.messageRight : styles.messageLeft,
                    { flexDirection: 'column', alignItems: isFromMe ? 'flex-end' : 'flex-start' }
                ]}>
                    {/* AI Thought (Collapsible) */}
                    {item.ai_thought && (
                        <View style={{ marginBottom: 4, alignItems: isFromMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            <TouchableOpacity
                                onPress={() => toggleThought(item.id)}
                                style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
                            >
                                <Text style={{ color: '#71717a', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginRight: 4 }}>RACIOCÍNIO</Text>
                                {expandedThoughts[item.id] ? <ChevronUp size={10} color="#71717a" /> : <ChevronDown size={10} color="#71717a" />}
                            </TouchableOpacity>

                            {expandedThoughts[item.id] && (
                                <View style={{ backgroundColor: 'rgba(39, 39, 42, 0.6)', padding: 10, borderRadius: 12, marginBottom: 6, overflow: 'hidden', borderLeftWidth: 2, borderLeftColor: '#7c3aed' }}>
                                    <Text style={{ color: '#d4d4d8', fontSize: 11, fontStyle: 'italic', lineHeight: 16 }}>
                                        {item.ai_thought}
                                    </Text>
                                    {/* Fade Out Effect at Bottom */}
                                    <LinearGradient
                                        colors={['transparent', 'rgba(39, 39, 42, 0.9)']}
                                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24 }}
                                        pointerEvents="none"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    <View style={[
                        styles.messageBubble,
                        // Shape Logic:
                        isFromMe ? styles.bubbleRight : styles.bubbleReceived,
                        // Color Overrides:
                        isFromMe && isAI ? styles.bubbleAI : (isFromMe ? styles.bubbleHuman : {}),

                        // USER REQUEST: AI Mode -> Glass Luminous Effect (Standard Shape)
                        (isFromMe && isAI && controlMode === 'ai') && {
                            backgroundColor: 'rgba(124, 58, 237, 0.35)', // Semi-transparent Purple
                            borderColor: 'rgba(167, 139, 250, 0.8)',     // Strong Luminous Border
                            borderWidth: 1.5,                            // Visible border
                        },

                        // Environmental Lighting: Bubbles feel the AI glow
                        controlMode === 'ai' && {
                            shadowColor: '#db2777',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1
                        }
                    ]}>
                        {/* AI Agent Name Badge */}
                        {isFromMe && isAI && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Brain size={10} color="rgba(255,255,255,0.7)" />
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', marginLeft: 4 }}>
                                    {item.agent_name || 'IA'}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.messageText}>{item.body}</Text>
                        <View style={styles.messageFooter}>
                            <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>

                            {/* Checkmark Logic: Single tick = pending, Double tick = sent */}
                            {isFromMe && (
                                isPending ? (
                                    <Check size={14} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
                                ) : item.ack >= 3 ? (
                                    <CheckCheck size={14} color="#3b82f6" style={{ marginLeft: 4 }} />
                                ) : (
                                    <CheckCheck size={14} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
                                )
                            )}
                        </View>
                    </View>
                </View>
            </AnimatedMessageWrapper>
        );
    };

    // --- MODE TOGGLE LOGIC (SWIPE UP) ---
    // --- MODE TOGGLE LOGIC (SWIPE UP) ---
    const swipeY = useRef(new Animated.Value(0)).current;
    const barColorAnim = useRef(new Animated.Value(controlMode === 'ai' ? 1 : 0)).current;

    // Debounce Ref to prevent double-firing
    const isTogglingRef = useRef(false);

    // Robust Toggle Function called by Gesture
    const performToggle = () => {
        if (isTogglingRef.current) return;
        isTogglingRef.current = true;

        // Simply call the robust REF-based handler via the ref bridge
        toggleModeRef.current();

        setTimeout(() => { isTogglingRef.current = false; }, 800); // 800ms Debounce
    };

    // Keep handleToggleMode updated in ret
    const toggleModeRef = useRef(handleToggleMode);
    useEffect(() => { toggleModeRef.current = handleToggleMode; }, [handleToggleMode]);

    useEffect(() => {
        // Skip animation if mode is still loading (null)
        if (controlMode === null) return;

        Animated.timing(barColorAnim, {
            toValue: controlMode === 'ai' ? 1 : 0,
            duration: 300,
            useNativeDriver: false
        }).start();
    }, [controlMode]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            // Allow even small moves to be tracked
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2,
            onPanResponderMove: Animated.event([null, { dy: swipeY }], { useNativeDriver: false }),
            onPanResponderRelease: (_, gestureState) => {
                const SWIPE_THRESHOLD = -20;
                const isTap = Math.abs(gestureState.dy) < 5;

                if (gestureState.dy < SWIPE_THRESHOLD || isTap) {
                    // Trigger Safe Toggle
                    performToggle();
                    Animated.spring(swipeY, { toValue: 0, useNativeDriver: false, bounciness: 12 }).start();
                    Vibration.vibrate(50);
                } else {
                    Animated.spring(swipeY, { toValue: 0, useNativeDriver: false }).start();
                }
            }
        })
    ).current;



    // --- TYPING & RECORDING INDICATORS (LEFT SIDE) ---

    // Simple 3-dot typing animation
    const AnimatedTypingBubble = () => {
        const dot1 = useRef(new Animated.Value(0)).current;
        const dot2 = useRef(new Animated.Value(0)).current;
        const dot3 = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            const animate = (dot, delay) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true })
                    ])
                ).start();
            };

            animate(dot1, 0);
            animate(dot2, 200);
            animate(dot3, 400);
        }, []);

        const dotStyle = (anim) => ({
            width: 6, height: 6, borderRadius: 3, backgroundColor: '#9ca3af', marginHorizontal: 2,
            opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }]
        });

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20, alignSelf: 'flex-start', marginVertical: 8 }}>
                <Animated.View style={dotStyle(dot1)} />
                <Animated.View style={dotStyle(dot2)} />
                <Animated.View style={dotStyle(dot3)} />
            </View>
        );
    };

    const LeadActivityIndicator = () => {
        // Animation refs
        const slideAnim = useRef(new Animated.Value(20)).current;
        const opacityAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            if (presence.status === 'composing' || presence.status === 'recording') {
                slideAnim.setValue(20);
                opacityAnim.setValue(0);

                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 500,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                        useNativeDriver: true
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true
                    })
                ]).start();
            }
        }, [presence.status]);

        if (!presence.status || presence.status === 'online' || presence.status === 'offline') return null;

        return (
            <Animated.View style={{
                marginVertical: 8,
                marginLeft: 0,
                backgroundColor: 'transparent',
                opacity: opacityAnim,
                transform: [{ translateY: slideAnim }]
            }}>
                {presence.status === 'composing' && <AnimatedTypingBubble />}

                {presence.status === 'recording' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20 }}>
                        <Mic size={24} color="#ef4444" />
                        <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444', marginHorizontal: 2 }} />
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444', marginHorizontal: 2 }} />
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444', marginHorizontal: 2 }} />
                        </View>
                    </View>
                )}
            </Animated.View>
        );
    };



    // Thinking indicator component - Clean, right-aligned bubble
    const [thoughtExpanded, setThoughtExpanded] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false); // NEW: Floating Menu State

    const ThinkingIndicator = () => {
        if (!aiThinking) return null;

        const opacity = pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
        });

        return (
            <TouchableOpacity
                onPress={() => setThoughtExpanded(!thoughtExpanded)}
                activeOpacity={0.7}
                style={{
                    alignSelf: 'flex-end',
                    marginRight: 16,
                    marginBottom: 12,
                    maxWidth: '75%',
                }}
            >
                <Animated.View style={{
                    opacity,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                }}>
                    <Brain size={14} color="#a78bfa" />
                    <Text style={{
                        color: '#a78bfa',
                        fontSize: 12,
                        fontWeight: '600',
                        fontStyle: 'italic',
                    }}>
                        Pensando...
                    </Text>
                    {thoughtExpanded ? (
                        <ChevronUp size={12} color="#a78bfa" />
                    ) : (
                        <ChevronDown size={12} color="#a78bfa" />
                    )}
                </Animated.View>

                {/* Expanded thought text - Local Fade In */}
                {thoughtExpanded && aiStatusText && (
                    <View style={{ marginTop: 4, position: 'relative' }}>
                        <Text
                            style={{
                                color: 'rgba(167, 139, 250, 0.9)',
                                fontSize: 11,
                                lineHeight: 16,
                            }}
                        >
                            {aiStatusText}
                        </Text>

                        {/* Fade Out Gradient at Bottom */}
                        <LinearGradient
                            colors={['transparent', colors.background]} // Fade to background
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: -2, // Slight overlap
                                height: 20, // Height of the fade
                            }}
                            pointerEvents="none"
                        />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.headerAvatar}>
                    {profilePicture ? (
                        <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{getInitials(name)}</Text>
                    )}
                </View>

                <View style={[styles.headerInfo, { justifyContent: 'center' }]}>
                    {/* Top Row: Name + Campaign + Status Badge + COST (Right) */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <Text style={styles.headerName} numberOfLines={1}>{name || 'Chat'}</Text>

                            {/* Campaign Name (smaller, muted) */}
                            {campaignName && (
                                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '500' }}>
                                    • {campaignName}
                                </Text>
                            )}

                            {/* Status Badge */}
                            {leadStatus && (() => {
                                const badge = getStatusBadge(leadStatus);
                                return (
                                    <View style={{
                                        backgroundColor: badge.bg,
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                        borderWidth: 1,
                                        borderColor: badge.color + '40'
                                    }}>
                                        <Text style={{ color: badge.color, fontSize: 9, fontWeight: '700' }}>
                                            {badge.label}
                                        </Text>
                                    </View>
                                );
                            })()}
                        </View>

                        {/* Cost Badge (Right) */}
                        {cost > 0 && (
                            <View style={styles.costBadge}>
                                <Bot size={12} color="#9ca3af" strokeWidth={1.5} style={{ marginRight: 3 }} />
                                <Text style={styles.costText}>R$ {parseFloat(cost).toFixed(2)}</Text>
                            </View>
                        )}
                    </View>

                    {/* Bottom Row: Detailed Status (Typing/Last Seen) */}
                    <Text style={[
                        styles.headerStatus,
                        { color: '#9ca3af', marginTop: 1 } // Standardized Neutral Color
                    ]}>
                        {presence.status === 'composing' ? 'Digitando...' :
                            presence.status === 'recording' ? 'Gravando áudio...' :
                                presence.status === 'online' ? 'Online' :
                                    presence.lastSeen ? (() => {
                                        const lastSeenDate = new Date(presence.lastSeen);
                                        const today = new Date();
                                        const yesterday = new Date(today);
                                        yesterday.setDate(yesterday.getDate() - 1);
                                        const time = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        if (lastSeenDate.toDateString() === today.toDateString()) {
                                            return `Visto hoje às ${time}`;
                                        } else if (lastSeenDate.toDateString() === yesterday.toDateString()) {
                                            return `Visto ontem às ${time}`;
                                        } else {
                                            return `Visto ${lastSeenDate.toLocaleDateString()} às ${time}`;
                                        }
                                    })() : null}
                    </Text>

                    {/* Optional row for Tags (if any exist) */}
                    {tags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            {tags.map((tag, idx) => (
                                <View key={idx} style={{ backgroundColor: tag.color || '#3b82f6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{tag.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* AI/Manual Toggle - Compact */}

                {/* Confirm Clear Chat */}
                {/* 3-Dots Menu Action */}
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => setMenuVisible(!menuVisible)}
                >
                    <MoreVertical size={20} color={colors.textMuted} />
                </TouchableOpacity>

                {/* --- FLOATING MENU (WhatsApp Style) --- */}
                {menuVisible && (
                    <>
                        <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            activeOpacity={1}
                            onPress={() => setMenuVisible(false)}
                        />
                        <View style={{
                            position: 'absolute',
                            top: 60,
                            right: 10,
                            backgroundColor: '#18181b', // Zachary dark
                            borderRadius: 12,
                            paddingVertical: 8,
                            minWidth: 180,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                            zIndex: 10000,
                            borderWidth: 1,
                            borderColor: '#27272a'
                        }}>
                            <TouchableOpacity
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 14, // Increased touch area
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#27272a'
                                }}
                                activeOpacity={0.6} // Explicit opacity feedback
                                onPress={() => {
                                    console.log('[UI] Limpar conversa clicked', chatId);
                                    setMenuVisible(false); // Close menu visually immediately

                                    // Async handling for Alert to ensure menu unmount logic is clean
                                    setTimeout(() => {
                                        Alert.alert(
                                            'Limpar conversa',
                                            'Tem certeza que deseja apagar todas as mensagens e tarefas desta conversa?',
                                            [
                                                { text: 'Cancelar', style: 'cancel' },
                                                {
                                                    text: 'Apagar tudo',
                                                    style: 'destructive',
                                                    onPress: async () => {
                                                        console.log('[UI] Apagar tudo confirmed for chat:', chatId);
                                                        try {
                                                            await apiService.clearChatMessages(chatId);
                                                            console.log('[UI] Chat cleared successfully');
                                                            setMessages([]); // Clear local state
                                                        } catch (err) {
                                                            console.error('[UI] Error clearing chat:', err);
                                                            Alert.alert('Erro', 'Falha ao limpar conversa.');
                                                        }
                                                    }
                                                }
                                            ]
                                        );
                                    }, 150); // Increased delay slightly
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '500' }}>Limpar conversa</Text>
                                    <Trash2 size={16} color="#ef4444" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 12, // Standard height
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#27272a'
                                }}
                                onPress={() => {
                                    setMenuVisible(false);
                                    const leadId = route.params?.leadId;
                                    if (!leadId) {
                                        Alert.alert('Erro', 'Este chat não está vinculado a um lead.');
                                        return;
                                    }

                                    const statuses = [
                                        { id: 'pending', label: 'Pendente' },
                                        { id: 'contacted', label: 'Contatado' },
                                        { id: 'responded', label: 'Respondeu' },
                                        { id: 'qualified', label: 'Qualificado' },
                                        { id: 'converted', label: 'Venda' },
                                        { id: 'lost', label: 'Perdido' },
                                        { id: 'junk', label: 'Inválido' },
                                        { id: 'manual_intervention', label: 'Intervenção Manual' },
                                    ];

                                    Alert.alert(
                                        'Alterar Etiqueta',
                                        'Selecione o novo status do lead:',
                                        [
                                            ...statuses.map(s => ({
                                                text: s.label,
                                                onPress: async () => {
                                                    try {
                                                        await apiService.updateLeadStatus(leadId, s.id);
                                                        setLeadStatus(s.id);
                                                        // Note: Sockets will handle real-time sync for other screens
                                                    } catch (err) {
                                                        Alert.alert('Erro', 'Falha ao atualizar status.');
                                                    }
                                                }
                                            })),
                                            { text: 'Cancelar', style: 'cancel' }
                                        ]
                                    );
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ color: '#e4e4e7', fontSize: 15, fontWeight: '500' }}>Alterar Etiqueta</Text>
                                    <Tag size={16} color="#e4e4e7" />
                                </View>
                            </TouchableOpacity>

                            {/* Placeholder Options */}
                            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setMenuVisible(false)}>
                                <Text style={{ color: '#e4e4e7', fontSize: 14 }}>Dados do contato</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setMenuVisible(false)}>
                                <Text style={{ color: '#e4e4e7', fontSize: 14 }}>Bloquear</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Messages Area */}
            <View style={{ flex: 1, position: 'relative' }}>
                {/* AI Pulsing Border Overlay - Discreet Vignette Glow */}
                {/* AI Pulsing Border Overlay - Discreet Vignette Glow (Reanimated) */}
                {/* REMOVED OLD FULL-HEIGHT SIDE GLOWS - Consolidated into bottom overlay below */}

                <KeyboardAvoidingView
                    style={{ flex: 1 }} // Removed marginBottom: 60 - Viewport goes to bottom
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <FlatList
                        ref={flatListRef}
                        data={messages} // Already sorted Newest-First (Descending)
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id?.toString() || item.message_id}
                        contentContainerStyle={[
                            styles.messagesList,
                            {
                                paddingTop: 0, // Handled by Animated Spacer
                                paddingBottom: 20
                            }
                        ]}
                        inverted={true} // Start from bottom
                        // removed onContentSizeChange auto-scroll as inverted handles it
                        ListHeaderComponent={ // Header becomes Footer in inverted mode
                            <View>
                                <ThinkingIndicator />
                                <LeadActivityIndicator />
                                <Animated.View style={{ height: paddingHeightAnim }} />
                            </View>
                        }
                    />

                    {/* Purple Glow Overlay (AI Mode) - Updated for Rich Gradient & Side Accents */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: '100%', // Extended to covers the whole screen as requested
                            pointerEvents: 'none',
                            opacity: glowOpacityAnim,
                        }}
                    >
                        {/* Main Wide Bottom Glow */}
                        <LinearGradient
                            colors={['rgba(124, 58, 237, 0.04)', 'rgba(219, 39, 119, 0.12)', 'rgba(79, 70, 229, 0.45)']}
                            locations={[0, 0.6, 1]}
                            style={{ flex: 1 }}
                        />
                        {/* Side Accents - now strictly contained within this 50% height view */}
                        {/* Old 6px gradients removed for cleaner look */}
                        {/* Side Accents REMOVED to clear view as requested */}
                    </Animated.View>

                    {/* Magic Input Area - NOW ABSOLUTELY POSITIONED FLOATING */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            bottom: 80, // Directly adjacent to the 80px toggle bar
                            left: 0,
                            right: 0,
                            backgroundColor: 'transparent', // NO background
                            paddingHorizontal: spacing.md,
                            paddingBottom: Math.max(insets.bottom, 8),
                            zIndex: 90, // Below toggle (100) but above content
                            transform: [
                                {
                                    // Move with the toggle bar during swipe
                                    translateY: Animated.add(
                                        inputSlideAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 100], // Slide down 100px
                                        }),
                                        swipeY.interpolate({
                                            inputRange: [-300, 0, 100],
                                            outputRange: [-150, 0, 10],
                                            extrapolate: 'clamp'
                                        })
                                    )
                                }
                            ],
                            opacity: inputSlideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0],
                            }),
                        }}
                    >
                        <View style={styles.magicInputPill}>
                            {/* Dynamic Blur Layer (Fades in on Focus) */}
                            <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden', opacity: blurOpacityAnim }]}>
                                <BlurView intensity={Platform.OS === 'ios' ? 30 : 50} tint="dark" style={StyleSheet.absoluteFill} />
                                {/* Optional: Subtle tint overlay */}
                                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} />
                            </Animated.View>
                            {!isRecording ? (
                                <>
                                    <TouchableOpacity onPress={pickImage} style={styles.mediaButton}>
                                        <Plus size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>

                                    <TextInput
                                        style={styles.magicTextInput}
                                        placeholder="Digite uma mensagem..."
                                        placeholderTextColor={colors.textMuted}
                                        value={inputValue}
                                        onChangeText={setInputValue}
                                        onFocus={() => setIsInputFocused(true)}
                                        onBlur={() => setIsInputFocused(false)}
                                        multiline
                                    />

                                    {inputValue.trim().length > 0 ? (
                                        <TouchableOpacity onPress={handleSend} style={styles.magicSendButton}>
                                            <LinearGradient
                                                colors={['#3b82f6', '#2563eb']}
                                                style={styles.sendGradient}
                                            >
                                                <Send size={18} color="#fff" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity onPress={startRecording} style={styles.magicMicButton}>
                                            <Mic size={22} color={colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                </>
                            ) : (
                                <View style={styles.recordingContainer}>
                                    <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
                                        <Trash2 size={20} color={colors.error} />
                                    </TouchableOpacity>

                                    <View style={styles.recordingIndicator}>
                                        <View style={styles.recordingDot} />
                                        <Text style={styles.recordingTime}>
                                            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                                        </Text>
                                    </View>

                                    <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
                                        <View style={styles.stopIcon} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>



            {!modeLoading && controlMode && (
                <SwipeToggleBar
                    controlMode={controlMode}
                    swipeY={swipeY}
                    barColorAnim={barColorAnim}
                    panHandlers={panResponder.panHandlers}
                />
            )}
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
        zIndex: 9999, // Ensure header (and menu) is above messages
    },
    backButton: {
        padding: spacing.xs,
        marginRight: spacing.xs,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    headerInfo: {
        flex: 1,
        marginRight: spacing.xs,
    },
    headerName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: colors.textMuted,
    },

    // Mode Toggle
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceLight,
        borderRadius: 20,
        padding: 3,
        marginRight: spacing.sm,
        position: 'relative',
        overflow: 'hidden',
    },
    modeSlider: {
        position: 'absolute',
        top: 3,
        bottom: 3,
        width: '48%',
        borderRadius: 17,
    },
    modeSliderAI: {
        left: 3,
        backgroundColor: '#8b5cf6',
    },
    modeSliderHuman: {
        right: 3,
        left: undefined,
        backgroundColor: '#3b82f6',
    },
    modeOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        zIndex: 1,
    },
    modeOptionActive: {
        // Active styling handled by slider
    },
    moreButton: {
        padding: spacing.xs,
    },

    // Messages Area
    messagesArea: {
        flex: 1,
    },
    messagesList: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    messageContainer: {
        marginBottom: spacing.sm,
        maxWidth: '80%',
    },
    messageLeft: {
        alignSelf: 'flex-start',
    },
    messageRight: {
        alignSelf: 'flex-end',
    },
    messageBubble: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 16,
    },
    bubbleReceived: {
        backgroundColor: colors.surfaceLight,
        borderTopLeftRadius: 4,
    },
    bubbleHuman: {
        backgroundColor: '#3b82f6',
        borderTopRightRadius: 4,
    },
    bubbleAI: {
        backgroundColor: '#8b5cf6',
        borderTopRightRadius: 4,
    },
    messageText: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    messageTime: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
    },
    emptyMessages: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 14,
    },

    // Thinking Indicator
    thinkingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    thinkingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: '#7c3aed',
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        gap: 8,
    },
    thinkingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#a78bfa',
        letterSpacing: 1,
    },

    // Input Area
    inputContainer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 80, // Push input above the 80px toggle bar
        backgroundColor: 'transparent', // REMOVED background to let light through
    },
    inputPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        minHeight: 56,
    },
    inputPillAI: {
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    // --- Magic UI Styles ---
    magicInputPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)', // Very subtle white glass
        borderRadius: 32, // Pill shape
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)', // Subtle glass edge
        paddingHorizontal: 6,
        paddingVertical: 6,
        minHeight: 56,
        // REMOVED ALL SHADOWS - No more dark blocking effect
        overflow: 'hidden'
    },
    magicGradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    magicInputText: {
        color: '#d8b4fe',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    },
    magicTextInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto'
    },
    mediaButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },
    magicSendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
        backgroundColor: '#2563eb' // Fallback
    },
    sendGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    magicMicButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4
    },
    recordingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8
    },
    recordingIndicator: {
        flex: 1,
        height: 4,
        backgroundColor: '#27272a',
        borderRadius: 2,
        marginHorizontal: 12,
        overflow: 'hidden'
    },
    recordingDot: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.error
    },
    stopButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center'
    },
    stopIcon: {
        width: 14,
        height: 14,
        backgroundColor: '#fff',
        borderRadius: 2
    },
    cancelButton: {
        padding: 8
    },
    textInput: {
        flex: 1,
        color: colors.text,
        fontSize: 15,
        maxHeight: 100,
        paddingVertical: spacing.sm,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiModeInput: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
    },
    aiModeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#a78bfa',
        letterSpacing: 1,
    },
    costBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2 },
    costText: { color: '#9ca3af', fontSize: 10, fontWeight: '700' },
});

// --- SWIPE TOGGLE BAR COMPONENT (Moved Outside to Prevent Re-Renders) ---
const SwipeToggleBar = React.memo(({ controlMode, swipeY, barColorAnim, panHandlers }) => {
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    if (keyboardVisible) return null;

    const humanColor = '#1e293b';

    return (
        <Animated.View
            {...panHandlers}
            style={{
                position: 'absolute',
                bottom: -420,
                left: 0,
                right: 0,
                height: 500,
                backgroundColor: 'transparent',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: 12,
                zIndex: 100,
                overflow: 'visible',
                transform: [{
                    translateY: swipeY.interpolate({
                        inputRange: [-300, 0, 100],
                        outputRange: [-150, 0, 10],
                        extrapolate: 'clamp'
                    })
                }]
            }}
        >
            {/* HUMAN MODE BASE */}
            <LinearGradient
                colors={[humanColor, humanColor, '#000000']}
                locations={[0, 0.15, 1]}
                style={{ ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            />

            {/* AI MODE GLASS */}
            <Animated.View style={{
                ...StyleSheet.absoluteFillObject,
                opacity: barColorAnim,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: 'hidden',
            }}>
                <LinearGradient
                    colors={['#7c3aed', '#db2777', '#4f46e5', '#000000']}
                    locations={[0, 0.2, 0.5, 1]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'transparent']}
                    start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* BORDER GLOW */}
            <Animated.View style={{
                ...StyleSheet.absoluteFillObject,
                opacity: barColorAnim,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderTopWidth: 1.5,
                borderLeftWidth: 0.5,
                borderRightWidth: 0.5,
                borderColor: 'rgba(255,255,255,0.6)',
                shadowColor: '#dbf4ff', shadowRadius: 10, shadowOpacity: 0.5,
            }} pointerEvents="none" />

            {/* CONTENT */}
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginBottom: 8, zIndex: 10 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 10 }}>
                {controlMode === 'ai'
                    ? <Sparkles size={16} color="#fff" style={{ shadowColor: '#fff', shadowRadius: 10, shadowOpacity: 0.8 }} />
                    : <User size={16} color="#fff" />}

                <Text style={{
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: 13,
                    letterSpacing: 1,
                    textShadowColor: controlMode === 'ai' ? 'rgba(255,255,255,0.5)' : undefined,
                    textShadowRadius: 10
                }}>
                    {controlMode === 'ai' ? 'MODO IA ATIVO' : 'MODO HUMAN'}
                </Text>

                {controlMode === 'ai' && (
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, ml: 4,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
                    }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>AUTO</Text>
                    </View>
                )}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2, zIndex: 10 }}>
                {controlMode === 'ai' ? 'Deslize para assumir' : 'Deslize para ativar IA'}
            </Text>
        </Animated.View>
    );
});

export default ChatDetailScreen;
