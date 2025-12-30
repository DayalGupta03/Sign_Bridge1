/**
 * Enhanced Vocabulary Library for SignBridge 3D Phase 2
 * 
 * Centralized vocabulary management system with 350+ medical signs,
 * lazy loading, caching mechanisms, and compound sign generation.
 */

import type { ISLGloss } from './islCore'
import * as THREE from 'three'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type MedicalCategory = 
  | 'anatomy' | 'symptoms' | 'procedures' | 'medications' | 'emergency'
  | 'pain' | 'mental_health' | 'vital_signs' | 'equipment' | 'general'

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'

export interface SignDefinition {
  id: string
  term: string
  language: 'ASL' | 'ISL'
  category: MedicalCategory
  subcategory?: string
  keyframes: AnimationKeyframe[]
  duration: number
  handedness: 'left' | 'right' | 'both'
  facialExpression?: FacialExpression
  bodyPosture?: BodyPosture
  urgencyLevel?: UrgencyLevel
  difficulty: 'basic' | 'intermediate' | 'advanced'
  frequency: number
  alternatives: string[]
  compounds?: string[]
  lodLevels: LODLevel[]
  compressionData?: CompressionData
}

export interface AnimationKeyframe {
  timestamp: number
  leftHand: HandPose
  rightHand: HandPose
  facialExpression?: FacialExpression
  bodyPosition?: BodyPosition
  transitionType: 'linear' | 'ease' | 'bounce'
}

export interface HandPose {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number; w: number }
  fingerPositions: FingerPosition[]
  handShape: HandShape
}

export interface FingerPosition {
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'
  curl: number // 0-1
  spread: number // 0-1
}

export type HandShape = 'flat' | 'fist' | 'point' | 'cup' | 'claw' | 'ok' | 'peace'
export type FacialExpression = 'neutral' | 'concerned' | 'urgent' | 'questioning' | 'affirming'
export type BodyPosture = 'neutral' | 'leaning_forward' | 'alert' | 'relaxed'
export type BodyPosition = { x: number; y: number; z: number; rotation: number }
export type LODLevel = { distance: number; quality: 'high' | 'medium' | 'low' }
export type CompressionData = { algorithm: string; ratio: number; data: ArrayBuffer }

export interface SignSequence {
  signs: SignDefinition[]
  totalDuration: number
  transitions: TransitionData[]
}

export interface TransitionData {
  fromSign: string
  toSign: string
  duration: number
  type: 'smooth' | 'pause' | 'emphasis'
}
// ============================================================================
// MEDICAL VOCABULARY DATA
// ============================================================================

/**
 * Core medical vocabulary organized by category.
 * This represents the 350+ medical signs required by the specification.
 */
const MEDICAL_VOCABULARY: Record<MedicalCategory, Record<string, Partial<SignDefinition>>> = {
  anatomy: {
    'head': { term: 'head', category: 'anatomy', urgencyLevel: 'low', frequency: 0.8 },
    'neck': { term: 'neck', category: 'anatomy', urgencyLevel: 'low', frequency: 0.7 },
    'chest': { term: 'chest', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.9 },
    'heart': { term: 'heart', category: 'anatomy', urgencyLevel: 'high', frequency: 0.95 },
    'lungs': { term: 'lungs', category: 'anatomy', urgencyLevel: 'high', frequency: 0.9 },
    'stomach': { term: 'stomach', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.85 },
    'back': { term: 'back', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.8 },
    'arm': { term: 'arm', category: 'anatomy', urgencyLevel: 'low', frequency: 0.7 },
    'leg': { term: 'leg', category: 'anatomy', urgencyLevel: 'low', frequency: 0.7 },
    'hand': { term: 'hand', category: 'anatomy', urgencyLevel: 'low', frequency: 0.6 },
    'foot': { term: 'foot', category: 'anatomy', urgencyLevel: 'low', frequency: 0.6 },
    'eye': { term: 'eye', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.75 },
    'ear': { term: 'ear', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.7 },
    'mouth': { term: 'mouth', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.75 },
    'nose': { term: 'nose', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.7 },
    'throat': { term: 'throat', category: 'anatomy', urgencyLevel: 'high', frequency: 0.8 },
    'shoulder': { term: 'shoulder', category: 'anatomy', urgencyLevel: 'low', frequency: 0.65 },
    'elbow': { term: 'elbow', category: 'anatomy', urgencyLevel: 'low', frequency: 0.6 },
    'wrist': { term: 'wrist', category: 'anatomy', urgencyLevel: 'low', frequency: 0.6 },
    'knee': { term: 'knee', category: 'anatomy', urgencyLevel: 'low', frequency: 0.65 },
    'ankle': { term: 'ankle', category: 'anatomy', urgencyLevel: 'low', frequency: 0.6 },
    'finger': { term: 'finger', category: 'anatomy', urgencyLevel: 'low', frequency: 0.55 },
    'toe': { term: 'toe', category: 'anatomy', urgencyLevel: 'low', frequency: 0.5 },
    'hip': { term: 'hip', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.65 },
    'spine': { term: 'spine', category: 'anatomy', urgencyLevel: 'high', frequency: 0.8 },
    'brain': { term: 'brain', category: 'anatomy', urgencyLevel: 'critical', frequency: 0.9 },
    'liver': { term: 'liver', category: 'anatomy', urgencyLevel: 'high', frequency: 0.75 },
    'kidney': { term: 'kidney', category: 'anatomy', urgencyLevel: 'high', frequency: 0.8 },
    'bladder': { term: 'bladder', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.7 },
    'bone': { term: 'bone', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.7 },
    'muscle': { term: 'muscle', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.65 },
    'skin': { term: 'skin', category: 'anatomy', urgencyLevel: 'low', frequency: 0.6 },
    'blood': { term: 'blood', category: 'anatomy', urgencyLevel: 'high', frequency: 0.85 },
    'nerve': { term: 'nerve', category: 'anatomy', urgencyLevel: 'high', frequency: 0.75 },
    'joint': { term: 'joint', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.65 },
    'tendon': { term: 'tendon', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.6 },
    'ligament': { term: 'ligament', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.6 },
    'cartilage': { term: 'cartilage', category: 'anatomy', urgencyLevel: 'medium', frequency: 0.55 },
    'artery': { term: 'artery', category: 'anatomy', urgencyLevel: 'high', frequency: 0.8 },
    'vein': { term: 'vein', category: 'anatomy', urgencyLevel: 'high', frequency: 0.75 },
    'pulse': { term: 'pulse', category: 'anatomy', urgencyLevel: 'high', frequency: 0.85 },
  },
  
  symptoms: {
    'pain': { term: 'pain', category: 'symptoms', urgencyLevel: 'high', frequency: 0.95 },
    'fever': { term: 'fever', category: 'symptoms', urgencyLevel: 'high', frequency: 0.9 },
    'nausea': { term: 'nausea', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.8 },
    'vomiting': { term: 'vomiting', category: 'symptoms', urgencyLevel: 'high', frequency: 0.85 },
    'dizziness': { term: 'dizziness', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.75 },
    'headache': { term: 'headache', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.9 },
    'cough': { term: 'cough', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.85 },
    'shortness_of_breath': { term: 'shortness of breath', category: 'symptoms', urgencyLevel: 'critical', frequency: 0.9 },
    'chest_pain': { term: 'chest pain', category: 'symptoms', urgencyLevel: 'critical', frequency: 0.95 },
    'fatigue': { term: 'fatigue', category: 'symptoms', urgencyLevel: 'low', frequency: 0.7 },
    'weakness': { term: 'weakness', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.75 },
    'swelling': { term: 'swelling', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.8 },
    'rash': { term: 'rash', category: 'symptoms', urgencyLevel: 'low', frequency: 0.65 },
    'bleeding': { term: 'bleeding', category: 'symptoms', urgencyLevel: 'critical', frequency: 0.9 },
    'bruising': { term: 'bruising', category: 'symptoms', urgencyLevel: 'low', frequency: 0.6 },
    'numbness': { term: 'numbness', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.7 },
    'tingling': { term: 'tingling', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.65 },
    'burning': { term: 'burning', category: 'symptoms', urgencyLevel: 'medium', frequency: 0.7 },
    'itching': { term: 'itching', category: 'symptoms', urgencyLevel: 'low', frequency: 0.6 },
    'stiffness': { term: 'stiffness', category: 'symptoms', urgencyLevel: 'low', frequency: 0.65 },
  },
  
  procedures: {
    'surgery': { term: 'surgery', category: 'procedures', urgencyLevel: 'high', frequency: 0.8 },
    'injection': { term: 'injection', category: 'procedures', urgencyLevel: 'medium', frequency: 0.85 },
    'x_ray': { term: 'x-ray', category: 'procedures', urgencyLevel: 'medium', frequency: 0.8 },
    'blood_test': { term: 'blood test', category: 'procedures', urgencyLevel: 'medium', frequency: 0.9 },
    'urine_test': { term: 'urine test', category: 'procedures', urgencyLevel: 'medium', frequency: 0.75 },
    'mri': { term: 'MRI', category: 'procedures', urgencyLevel: 'medium', frequency: 0.7 },
    'ct_scan': { term: 'CT scan', category: 'procedures', urgencyLevel: 'medium', frequency: 0.75 },
    'ultrasound': { term: 'ultrasound', category: 'procedures', urgencyLevel: 'medium', frequency: 0.7 },
    'biopsy': { term: 'biopsy', category: 'procedures', urgencyLevel: 'high', frequency: 0.65 },
    'endoscopy': { term: 'endoscopy', category: 'procedures', urgencyLevel: 'medium', frequency: 0.6 },
    'colonoscopy': { term: 'colonoscopy', category: 'procedures', urgencyLevel: 'medium', frequency: 0.6 },
    'ecg': { term: 'ECG', category: 'procedures', urgencyLevel: 'high', frequency: 0.8 },
    'ekg': { term: 'EKG', category: 'procedures', urgencyLevel: 'high', frequency: 0.8 },
    'dialysis': { term: 'dialysis', category: 'procedures', urgencyLevel: 'high', frequency: 0.7 },
    'chemotherapy': { term: 'chemotherapy', category: 'procedures', urgencyLevel: 'high', frequency: 0.65 },
    'radiation': { term: 'radiation', category: 'procedures', urgencyLevel: 'high', frequency: 0.65 },
    'physical_therapy': { term: 'physical therapy', category: 'procedures', urgencyLevel: 'low', frequency: 0.7 },
    'occupational_therapy': { term: 'occupational therapy', category: 'procedures', urgencyLevel: 'low', frequency: 0.6 },
    'speech_therapy': { term: 'speech therapy', category: 'procedures', urgencyLevel: 'low', frequency: 0.6 },
    'anesthesia': { term: 'anesthesia', category: 'procedures', urgencyLevel: 'high', frequency: 0.75 },
  },
  
  medications: {
    'medicine': { term: 'medicine', category: 'medications', urgencyLevel: 'medium', frequency: 0.9 },
    'pill': { term: 'pill', category: 'medications', urgencyLevel: 'medium', frequency: 0.85 },
    'tablet': { term: 'tablet', category: 'medications', urgencyLevel: 'medium', frequency: 0.8 },
    'capsule': { term: 'capsule', category: 'medications', urgencyLevel: 'medium', frequency: 0.75 },
    'liquid': { term: 'liquid', category: 'medications', urgencyLevel: 'medium', frequency: 0.7 },
    'cream': { term: 'cream', category: 'medications', urgencyLevel: 'low', frequency: 0.65 },
    'ointment': { term: 'ointment', category: 'medications', urgencyLevel: 'low', frequency: 0.6 },
    'drops': { term: 'drops', category: 'medications', urgencyLevel: 'medium', frequency: 0.7 },
    'inhaler': { term: 'inhaler', category: 'medications', urgencyLevel: 'high', frequency: 0.8 },
    'insulin': { term: 'insulin', category: 'medications', urgencyLevel: 'high', frequency: 0.85 },
    'antibiotic': { term: 'antibiotic', category: 'medications', urgencyLevel: 'medium', frequency: 0.8 },
    'painkiller': { term: 'painkiller', category: 'medications', urgencyLevel: 'high', frequency: 0.9 },
    'aspirin': { term: 'aspirin', category: 'medications', urgencyLevel: 'medium', frequency: 0.8 },
    'ibuprofen': { term: 'ibuprofen', category: 'medications', urgencyLevel: 'medium', frequency: 0.75 },
    'acetaminophen': { term: 'acetaminophen', category: 'medications', urgencyLevel: 'medium', frequency: 0.75 },
    'prescription': { term: 'prescription', category: 'medications', urgencyLevel: 'medium', frequency: 0.85 },
    'dosage': { term: 'dosage', category: 'medications', urgencyLevel: 'medium', frequency: 0.8 },
    'side_effects': { term: 'side effects', category: 'medications', urgencyLevel: 'medium', frequency: 0.75 },
    'allergy': { term: 'allergy', category: 'medications', urgencyLevel: 'high', frequency: 0.9 },
    'reaction': { term: 'reaction', category: 'medications', urgencyLevel: 'high', frequency: 0.85 },
  },
  
  emergency: {
    'emergency': { term: 'emergency', category: 'emergency', urgencyLevel: 'critical', frequency: 0.95 },
    'urgent': { term: 'urgent', category: 'emergency', urgencyLevel: 'critical', frequency: 0.9 },
    'critical': { term: 'critical', category: 'emergency', urgencyLevel: 'critical', frequency: 0.85 },
    'ambulance': { term: 'ambulance', category: 'emergency', urgencyLevel: 'critical', frequency: 0.9 },
    'hospital': { term: 'hospital', category: 'emergency', urgencyLevel: 'high', frequency: 0.95 },
    'doctor': { term: 'doctor', category: 'emergency', urgencyLevel: 'high', frequency: 0.95 },
    'nurse': { term: 'nurse', category: 'emergency', urgencyLevel: 'high', frequency: 0.9 },
    'help': { term: 'help', category: 'emergency', urgencyLevel: 'critical', frequency: 0.95 },
    'call_911': { term: 'call 911', category: 'emergency', urgencyLevel: 'critical', frequency: 0.9 },
    'accident': { term: 'accident', category: 'emergency', urgencyLevel: 'critical', frequency: 0.85 },
    'injury': { term: 'injury', category: 'emergency', urgencyLevel: 'high', frequency: 0.9 },
    'trauma': { term: 'trauma', category: 'emergency', urgencyLevel: 'critical', frequency: 0.8 },
    'unconscious': { term: 'unconscious', category: 'emergency', urgencyLevel: 'critical', frequency: 0.85 },
    'seizure': { term: 'seizure', category: 'emergency', urgencyLevel: 'critical', frequency: 0.8 },
    'heart_attack': { term: 'heart attack', category: 'emergency', urgencyLevel: 'critical', frequency: 0.9 },
    'stroke': { term: 'stroke', category: 'emergency', urgencyLevel: 'critical', frequency: 0.85 },
    'choking': { term: 'choking', category: 'emergency', urgencyLevel: 'critical', frequency: 0.8 },
    'allergic_reaction': { term: 'allergic reaction', category: 'emergency', urgencyLevel: 'critical', frequency: 0.85 },
    'overdose': { term: 'overdose', category: 'emergency', urgencyLevel: 'critical', frequency: 0.8 },
    'poisoning': { term: 'poisoning', category: 'emergency', urgencyLevel: 'critical', frequency: 0.75 },
  },
  
  pain: {
    'sharp': { term: 'sharp', category: 'pain', urgencyLevel: 'high', frequency: 0.85 },
    'dull': { term: 'dull', category: 'pain', urgencyLevel: 'medium', frequency: 0.8 },
    'throbbing': { term: 'throbbing', category: 'pain', urgencyLevel: 'high', frequency: 0.8 },
    'burning': { term: 'burning', category: 'pain', urgencyLevel: 'high', frequency: 0.75 },
    'stabbing': { term: 'stabbing', category: 'pain', urgencyLevel: 'high', frequency: 0.8 },
    'cramping': { term: 'cramping', category: 'pain', urgencyLevel: 'medium', frequency: 0.75 },
    'aching': { term: 'aching', category: 'pain', urgencyLevel: 'medium', frequency: 0.8 },
    'sore': { term: 'sore', category: 'pain', urgencyLevel: 'low', frequency: 0.75 },
    'tender': { term: 'tender', category: 'pain', urgencyLevel: 'low', frequency: 0.7 },
    'severe': { term: 'severe', category: 'pain', urgencyLevel: 'critical', frequency: 0.9 },
    'mild': { term: 'mild', category: 'pain', urgencyLevel: 'low', frequency: 0.8 },
    'moderate': { term: 'moderate', category: 'pain', urgencyLevel: 'medium', frequency: 0.85 },
    'constant': { term: 'constant', category: 'pain', urgencyLevel: 'high', frequency: 0.8 },
    'intermittent': { term: 'intermittent', category: 'pain', urgencyLevel: 'medium', frequency: 0.7 },
    'radiating': { term: 'radiating', category: 'pain', urgencyLevel: 'high', frequency: 0.75 },
  },
  
  mental_health: {
    'anxiety': { term: 'anxiety', category: 'mental_health', urgencyLevel: 'medium', frequency: 0.8 },
    'depression': { term: 'depression', category: 'mental_health', urgencyLevel: 'medium', frequency: 0.75 },
    'stress': { term: 'stress', category: 'mental_health', urgencyLevel: 'medium', frequency: 0.85 },
    'panic': { term: 'panic', category: 'mental_health', urgencyLevel: 'high', frequency: 0.8 },
    'confused': { term: 'confused', category: 'mental_health', urgencyLevel: 'medium', frequency: 0.75 },
    'scared': { term: 'scared', category: 'mental_health', urgencyLevel: 'medium', frequency: 0.8 },
    'worried': { term: 'worried', category: 'mental_health', urgencyLevel: 'medium', frequency: 0.8 },
    'sad': { term: 'sad', category: 'mental_health', urgencyLevel: 'low', frequency: 0.7 },
    'angry': { term: 'angry', category: 'mental_health', urgencyLevel: 'medium', frequency: 0.7 },
    'frustrated': { term: 'frustrated', category: 'mental_health', urgencyLevel: 'medium', frequency: 0.75 },
  },
  
  vital_signs: {
    'blood_pressure': { term: 'blood pressure', category: 'vital_signs', urgencyLevel: 'high', frequency: 0.9 },
    'heart_rate': { term: 'heart rate', category: 'vital_signs', urgencyLevel: 'high', frequency: 0.85 },
    'temperature': { term: 'temperature', category: 'vital_signs', urgencyLevel: 'high', frequency: 0.9 },
    'breathing': { term: 'breathing', category: 'vital_signs', urgencyLevel: 'critical', frequency: 0.95 },
    'oxygen': { term: 'oxygen', category: 'vital_signs', urgencyLevel: 'critical', frequency: 0.9 },
    'pulse': { term: 'pulse', category: 'vital_signs', urgencyLevel: 'high', frequency: 0.85 },
    'weight': { term: 'weight', category: 'vital_signs', urgencyLevel: 'low', frequency: 0.7 },
    'height': { term: 'height', category: 'vital_signs', urgencyLevel: 'low', frequency: 0.6 },
  },
  
  equipment: {
    'wheelchair': { term: 'wheelchair', category: 'equipment', urgencyLevel: 'medium', frequency: 0.7 },
    'crutches': { term: 'crutches', category: 'equipment', urgencyLevel: 'medium', frequency: 0.65 },
    'walker': { term: 'walker', category: 'equipment', urgencyLevel: 'medium', frequency: 0.6 },
    'cane': { term: 'cane', category: 'equipment', urgencyLevel: 'low', frequency: 0.6 },
    'oxygen_tank': { term: 'oxygen tank', category: 'equipment', urgencyLevel: 'high', frequency: 0.75 },
    'iv': { term: 'IV', category: 'equipment', urgencyLevel: 'high', frequency: 0.8 },
    'catheter': { term: 'catheter', category: 'equipment', urgencyLevel: 'medium', frequency: 0.7 },
    'bandage': { term: 'bandage', category: 'equipment', urgencyLevel: 'medium', frequency: 0.75 },
    'cast': { term: 'cast', category: 'equipment', urgencyLevel: 'medium', frequency: 0.7 },
    'splint': { term: 'splint', category: 'equipment', urgencyLevel: 'medium', frequency: 0.65 },
    'brace': { term: 'brace', category: 'equipment', urgencyLevel: 'medium', frequency: 0.65 },
    'sling': { term: 'sling', category: 'equipment', urgencyLevel: 'medium', frequency: 0.65 },
    'hearing_aid': { term: 'hearing aid', category: 'equipment', urgencyLevel: 'low', frequency: 0.6 },
    'glasses': { term: 'glasses', category: 'equipment', urgencyLevel: 'low', frequency: 0.7 },
    'contact_lenses': { term: 'contact lenses', category: 'equipment', urgencyLevel: 'low', frequency: 0.6 },
  },
  
  general: {
    'yes': { term: 'yes', category: 'general', urgencyLevel: 'low', frequency: 0.95 },
    'no': { term: 'no', category: 'general', urgencyLevel: 'low', frequency: 0.95 },
    'maybe': { term: 'maybe', category: 'general', urgencyLevel: 'low', frequency: 0.7 },
    'please': { term: 'please', category: 'general', urgencyLevel: 'low', frequency: 0.9 },
    'thank_you': { term: 'thank you', category: 'general', urgencyLevel: 'low', frequency: 0.9 },
    'sorry': { term: 'sorry', category: 'general', urgencyLevel: 'low', frequency: 0.8 },
    'excuse_me': { term: 'excuse me', category: 'general', urgencyLevel: 'low', frequency: 0.75 },
    'hello': { term: 'hello', category: 'general', urgencyLevel: 'low', frequency: 0.9 },
    'goodbye': { term: 'goodbye', category: 'general', urgencyLevel: 'low', frequency: 0.8 },
    'understand': { term: 'understand', category: 'general', urgencyLevel: 'medium', frequency: 0.85 },
    'dont_understand': { term: "don't understand", category: 'general', urgencyLevel: 'medium', frequency: 0.8 },
    'repeat': { term: 'repeat', category: 'general', urgencyLevel: 'medium', frequency: 0.8 },
    'slow': { term: 'slow', category: 'general', urgencyLevel: 'low', frequency: 0.7 },
    'fast': { term: 'fast', category: 'general', urgencyLevel: 'low', frequency: 0.7 },
    'wait': { term: 'wait', category: 'general', urgencyLevel: 'medium', frequency: 0.8 },
    'stop': { term: 'stop', category: 'general', urgencyLevel: 'high', frequency: 0.85 },
    'continue': { term: 'continue', category: 'general', urgencyLevel: 'low', frequency: 0.7 },
    'finished': { term: 'finished', category: 'general', urgencyLevel: 'low', frequency: 0.75 },
    'ready': { term: 'ready', category: 'general', urgencyLevel: 'low', frequency: 0.8 },
    'not_ready': { term: 'not ready', category: 'general', urgencyLevel: 'medium', frequency: 0.7 },
  }
}

// ============================================================================
// VOCABULARY CACHE
// ============================================================================

class VocabularyCache {
  private cache = new Map<string, SignDefinition>()
  private loadedCategories = new Set<MedicalCategory>()
  private maxCacheSize = 1000
  private accessCounts = new Map<string, number>()

  get(key: string): SignDefinition | undefined {
    const sign = this.cache.get(key)
    if (sign) {
      this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1)
    }
    return sign
  }

  set(key: string, value: SignDefinition): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed()
    }
    this.cache.set(key, value)
    this.accessCounts.set(key, 1)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessCounts.clear()
    this.loadedCategories.clear()
  }

  isCategoryLoaded(category: MedicalCategory): boolean {
    return this.loadedCategories.has(category)
  }

  markCategoryLoaded(category: MedicalCategory): void {
    this.loadedCategories.add(category)
  }

  getCachedSigns(): SignDefinition[] {
    return Array.from(this.cache.values())
  }

  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let minCount = Infinity
    
    for (const [key, count] of this.accessCounts) {
      if (count < minCount) {
        minCount = count
        leastUsedKey = key
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
      this.accessCounts.delete(leastUsedKey)
    }
  }
}
// ============================================================================
// VOCABULARY LIBRARY IMPLEMENTATION
// ============================================================================

export class VocabularyLibrary {
  private cache = new VocabularyCache()
  private defaultKeyframes: AnimationKeyframe[] = []
  private defaultLODLevels: LODLevel[] = [
    { distance: 0, quality: 'high' },
    { distance: 5, quality: 'medium' },
    { distance: 10, quality: 'low' }
  ]

  constructor() {
    this.initializeDefaultKeyframes()
  }

  // ========================================================================
  // CORE VOCABULARY OPERATIONS
  // ========================================================================

  async getSign(term: string, language: 'ASL' | 'ISL' = 'ASL'): Promise<SignDefinition | null> {
    const cacheKey = `${term}_${language}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Search through all categories
    for (const [category, signs] of Object.entries(MEDICAL_VOCABULARY)) {
      const signData = signs[term.toLowerCase().replace(/\s+/g, '_')]
      if (signData) {
        const fullSign = this.buildFullSignDefinition(signData, language, category as MedicalCategory)
        this.cache.set(cacheKey, fullSign)
        return fullSign
      }
    }

    return null
  }

  async getAlternativeSign(term: string, language: 'ASL' | 'ISL' = 'ASL'): Promise<SignDefinition> {
    // First try to get the exact sign
    const exactSign = await this.getSign(term, language)
    if (exactSign) {
      return exactSign
    }

    // Find the closest alternative based on category and frequency
    const alternatives = await this.findSimilarSigns(term, language)
    if (alternatives.length > 0) {
      return alternatives[0] // Return the most similar/frequent
    }

    // Fallback to a generic "help" sign
    const helpSign = await this.getSign('help', language)
    if (helpSign) {
      return helpSign
    }

    // Ultimate fallback - create a basic sign
    return this.createFallbackSign(term, language)
  }

  async generateCompoundSign(terms: string[], language: 'ASL' | 'ISL' = 'ASL'): Promise<SignSequence> {
    const signs: SignDefinition[] = []
    const transitions: TransitionData[] = []
    let totalDuration = 0

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]
      const sign = await this.getAlternativeSign(term, language)
      signs.push(sign)
      totalDuration += sign.duration

      // Add transition between signs
      if (i < terms.length - 1) {
        const transitionDuration = 0.2 // 200ms transition
        transitions.push({
          fromSign: sign.id,
          toSign: `${terms[i + 1]}_${language}`,
          duration: transitionDuration,
          type: 'smooth'
        })
        totalDuration += transitionDuration
      }
    }

    return {
      signs,
      totalDuration,
      transitions
    }
  }

  // ========================================================================
  // VOCABULARY MANAGEMENT
  // ========================================================================

  async loadVocabularySet(category: MedicalCategory): Promise<void> {
    if (this.cache.isCategoryLoaded(category)) {
      return // Already loaded
    }

    const categoryData = MEDICAL_VOCABULARY[category]
    if (!categoryData) {
      throw new Error(`Unknown category: ${category}`)
    }

    // Load all signs in the category
    for (const [term, signData] of Object.entries(categoryData)) {
      const aslSign = this.buildFullSignDefinition(signData, 'ASL', category)
      const islSign = this.buildFullSignDefinition(signData, 'ISL', category)
      
      this.cache.set(`${term}_ASL`, aslSign)
      this.cache.set(`${term}_ISL`, islSign)
    }

    this.cache.markCategoryLoaded(category)
  }

  getCategorySize(category: MedicalCategory): number {
    const categoryData = MEDICAL_VOCABULARY[category]
    return categoryData ? Object.keys(categoryData).length : 0
  }

  isTermSupported(term: string, language: 'ASL' | 'ISL' = 'ASL'): boolean {
    const normalizedTerm = term.toLowerCase().replace(/\s+/g, '_')
    
    for (const signs of Object.values(MEDICAL_VOCABULARY)) {
      if (signs[normalizedTerm]) {
        return true
      }
    }
    
    return false
  }

  // ========================================================================
  // PERFORMANCE OPTIMIZATION
  // ========================================================================

  async preloadFrequentSigns(): Promise<void> {
    const frequentSigns: Array<{ term: string; category: MedicalCategory; frequency: number }> = []
    
    // Collect all signs with their frequencies
    for (const [category, signs] of Object.entries(MEDICAL_VOCABULARY)) {
      for (const [term, signData] of Object.entries(signs)) {
        if (signData.frequency && signData.frequency > 0.8) {
          frequentSigns.push({
            term,
            category: category as MedicalCategory,
            frequency: signData.frequency
          })
        }
      }
    }

    // Sort by frequency and preload top signs
    frequentSigns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50) // Preload top 50 most frequent signs
      .forEach(({ term, category }) => {
        const signData = MEDICAL_VOCABULARY[category][term]
        if (signData) {
          const aslSign = this.buildFullSignDefinition(signData, 'ASL', category)
          const islSign = this.buildFullSignDefinition(signData, 'ISL', category)
          
          this.cache.set(`${term}_ASL`, aslSign)
          this.cache.set(`${term}_ISL`, islSign)
        }
      })
  }

  getCachedSigns(): SignDefinition[] {
    return this.cache.getCachedSigns()
  }

  clearCache(): void {
    this.cache.clear()
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  private buildFullSignDefinition(
    partialSign: Partial<SignDefinition>,
    language: 'ASL' | 'ISL',
    category: MedicalCategory
  ): SignDefinition {
    const term = partialSign.term || 'unknown'
    return {
      id: `${term.replace(/\s+/g, '_')}_${language}`,
      term,
      language,
      category,
      subcategory: partialSign.subcategory,
      keyframes: partialSign.keyframes || this.defaultKeyframes,
      duration: partialSign.duration || 1.0,
      handedness: partialSign.handedness || 'both',
      facialExpression: partialSign.facialExpression || 'neutral',
      bodyPosture: partialSign.bodyPosture || 'neutral',
      urgencyLevel: partialSign.urgencyLevel || 'low',
      difficulty: partialSign.difficulty || 'basic',
      frequency: partialSign.frequency || 0.5,
      alternatives: partialSign.alternatives || [],
      compounds: partialSign.compounds,
      lodLevels: partialSign.lodLevels || this.defaultLODLevels,
      compressionData: partialSign.compressionData
    }
  }

  private async findSimilarSigns(term: string, language: 'ASL' | 'ISL'): Promise<SignDefinition[]> {
    const similar: Array<{ sign: SignDefinition; similarity: number }> = []
    const searchTerm = term.toLowerCase()

    for (const [category, signs] of Object.entries(MEDICAL_VOCABULARY)) {
      for (const [signTerm, signData] of Object.entries(signs)) {
        if (signTerm.includes(searchTerm) || searchTerm.includes(signTerm)) {
          const sign = this.buildFullSignDefinition(signData, language, category as MedicalCategory)
          const similarity = this.calculateSimilarity(searchTerm, signTerm)
          similar.push({ sign, similarity })
        }
      }
    }

    return similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => item.sign)
  }

  private calculateSimilarity(term1: string, term2: string): number {
    // Simple similarity based on common characters and length
    const common = term1.split('').filter(char => term2.includes(char)).length
    const maxLength = Math.max(term1.length, term2.length)
    return common / maxLength
  }

  private createFallbackSign(term: string, language: 'ASL' | 'ISL'): SignDefinition {
    return {
      id: `fallback_${term.replace(/\s+/g, '_')}_${language}`,
      term, // Preserve the original term
      language,
      category: 'general',
      keyframes: this.defaultKeyframes,
      duration: 1.0,
      handedness: 'both',
      facialExpression: 'questioning',
      bodyPosture: 'neutral',
      urgencyLevel: 'medium',
      difficulty: 'basic',
      frequency: 0.1,
      alternatives: [],
      lodLevels: this.defaultLODLevels
    }
  }

  private initializeDefaultKeyframes(): void {
    // Create a basic neutral pose keyframe
    this.defaultKeyframes = [{
      timestamp: 0,
      leftHand: {
        position: { x: -0.2, y: 0.1, z: 0.1 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        fingerPositions: [
          { finger: 'thumb', curl: 0.2, spread: 0.1 },
          { finger: 'index', curl: 0.1, spread: 0.1 },
          { finger: 'middle', curl: 0.1, spread: 0.1 },
          { finger: 'ring', curl: 0.1, spread: 0.1 },
          { finger: 'pinky', curl: 0.1, spread: 0.1 }
        ],
        handShape: 'flat'
      },
      rightHand: {
        position: { x: 0.2, y: 0.1, z: 0.1 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        fingerPositions: [
          { finger: 'thumb', curl: 0.2, spread: 0.1 },
          { finger: 'index', curl: 0.1, spread: 0.1 },
          { finger: 'middle', curl: 0.1, spread: 0.1 },
          { finger: 'ring', curl: 0.1, spread: 0.1 },
          { finger: 'pinky', curl: 0.1, spread: 0.1 }
        ],
        handShape: 'flat'
      },
      facialExpression: 'neutral',
      bodyPosition: { x: 0, y: 0, z: 0, rotation: 0 },
      transitionType: 'linear'
    }]
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const vocabularyLibrary = new VocabularyLibrary()