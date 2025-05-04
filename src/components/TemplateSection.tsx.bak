'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  MicrophoneIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { PlayCircleIcon as HeroPlayIcon } from '@heroicons/react/24/solid';
import { EmailTemplate, SmsTemplate, VoicemailTemplate } from '@/lib/types';

interface TemplateSectionProps {
  type: 'email' | 'sms' | 'voicemail';
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: () => void;
  templates: Array<EmailTemplate | SmsTemplate | VoicemailTemplate>;
  selectedTemplateIds: string[];
  onTemplateSelect: (id: string, selected: boolean) => void;
  highlightColor: string;
  onSaveTemplate: (template: EmailTemplate | SmsTemplate | VoicemailTemplate) => void;
}

// Variable tags for each template type
const variableTags = {
  email: ['firstName', 'lastName', 'propertyAddress', 'propertyPrice', 'propertyLink'],
  sms: ['firstName', 'propertyAddress', 'propertyLink'],
  voicemail: ['firstName', 'propertyAddress', 'agentName', 'companyName']
};

export default function TemplateSection({
  type,
  title,
  icon,
  enabled,
  onToggle,
  templates,
  selectedTemplateIds,
  onTemplateSelect,
  highlightColor,
  onSaveTemplate,
}: TemplateSectionProps) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editedTemplate, setEditedTemplate] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  
  // Clean up recording resources when component unmounts
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
  const handleCreateTemplate = () => {
    let newTemplate: EmailTemplate | SmsTemplate | VoicemailTemplate;
    
    if (type === 'email') {
      newTemplate = {
        id: 'new_' + Date.now(),
        name: 'New Email Template',
        subject: '',
        body: '',
        type: 'custom'
      };
    } else if (type === 'sms') {
      newTemplate = {
        id: 'new_' + Date.now(),
        name: 'New SMS Template',
        message: '',
        type: 'custom'
      };
    } else {
      newTemplate = {
        id: 'new_' + Date.now(),
        name: 'New Voicemail Template',
        audioUrl: '',
        transcription: '',
        type: 'custom'
      };
    }
    
    setEditedTemplate(newTemplate);
    setEditingTemplateId('new_' + Date.now());
  };
  
  const handleEditTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditedTemplate({...template});
      setEditingTemplateId(templateId);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTemplate((prev: any) => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditedTemplate((prev: any) => ({ ...prev, [name]: checked }));
  };

  const insertVariable = (fieldName: string, variable: string) => {
    setEditedTemplate((prev: any) => ({ 
      ...prev, 
      [fieldName]: prev[fieldName] + ` {{${variable}}}`
    }));
  };
  
  const handleSave = () => {
    if (validateTemplate()) {
      onSaveTemplate(editedTemplate);
      setEditingTemplateId(null);
      setEditedTemplate(null);
    }
  };
  
  const handleCancel = () => {
    setEditingTemplateId(null);
    setEditedTemplate(null);
    setErrors({});
  };
  
  const validateTemplate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editedTemplate.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (type === 'email') {
      if (!editedTemplate.subject.trim()) {
        newErrors.subject = 'Subject is required';
      }
      if (!editedTemplate.body.trim()) {
        newErrors.body = 'Email body is required';
      }
    }

    if (type === 'sms') {
      if (!editedTemplate.message.trim()) {
        newErrors.message = 'Message is required';
      } else if (editedTemplate.message.length > 160) {
        newErrors.message = 'Message cannot exceed 160 characters';
      }
    }

    if (type === 'voicemail') {
      if (!editedTemplate.transcription.trim()) {
        newErrors.transcription = 'Transcription is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle audio playback for voicemail templates
  const handlePlayAudio = (templateId: string, audioUrl: string) => {
    if (isPlaying === templateId) {
      audioRef.current?.pause();
      setIsPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          toast.error('Could not play audio file');
        });
        setIsPlaying(templateId);
        
        audioRef.current.onended = () => {
          setIsPlaying(null);
        };
      }
    }
  };
  
  // Handle audio recording for voicemail templates
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(blob);
        
        // Create temp URL for playback
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(blob);
        }
        
        // Update template with audio duration
        setEditedTemplate((prev: any) => ({
          ...prev,
          duration: recordingTime,
          audioUrl: URL.createObjectURL(blob)
        }));
        
        // Mock transcription (in a real app this would call a service)
        mockTranscription();
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        toast.success('Recording completed! Transcription generated.');
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer for recording
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Mock transcription service - in a real app, this would call an API
  const mockTranscription = () => {
    const templateVariables = variableTags.voicemail;
    const phrases = [
      `Hi {{${templateVariables[0]}}}, this is {{${templateVariables[2]}}} from {{${templateVariables[3]}}}. I noticed you might be interested in a property at {{${templateVariables[1]}}}. Please give me a call back when you have a moment.`,
      `Hello {{${templateVariables[0]}}}, I'm reaching out about a property at {{${templateVariables[1]}}} that might interest you. Call me back when you get a chance.`,
      `Hi {{${templateVariables[0]}}}, it's {{${templateVariables[2]}}} calling about the property at {{${templateVariables[1]}}}. I'd love to discuss this opportunity with you when you have time.`
    ];
    
    const randomIndex = Math.floor(Math.random() * phrases.length);
    
    setEditedTemplate((prev: any) => ({
      ...prev,
      transcription: phrases[randomIndex]
    }));
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is audio
      if (!file.type.startsWith('audio/')) {
        toast.error('Please upload an audio file');
        return;
      }
      
      const url = URL.createObjectURL(file);
      
      // Update audio element to get duration
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onloadedmetadata = () => {
          const duration = Math.floor(audioRef.current?.duration || 0);
          setEditedTemplate((prev: any) => ({
            ...prev,
            duration: duration,
            audioUrl: url
          }));
        };
      }
      
      setAudioBlob(file);
      
      // Mock transcription
      mockTranscription();
      
      toast.success('Audio uploaded successfully! Transcription generated.');
    }
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden`}>
      <div className={`p-4 bg-${highlightColor}-50 border-b border-gray-200 flex items-center justify-between`}>
        <div className="flex items-center">
          {icon}
          <h4 className={`font-medium text-${highlightColor}-900`}>{title}</h4>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id={type}
            checked={enabled}
            onChange={onToggle}
            className={`h-4 w-4 text-${highlightColor}-600 border-gray-300 rounded`}
          />
          <label htmlFor={type} className="ml-2 text-sm text-gray-700">
            Enable
          </label>
        </div>
      </div>
      
      {enabled && (
        <div className="p-4">
          {!editingTemplateId ? (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium text-gray-700">Select Templates:</h5>
                <button
                  type="button"
                  onClick={handleCreateTemplate}
                  className={`text-sm text-${highlightColor}-600 hover:text-${highlightColor}-800 flex items-center`}
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  New Template
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto p-1">
                {templates.map(template => (
                  <div key={template.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                    <div className="flex items-start mb-2">
                      <input
                        type="checkbox"
                        id={`${type}-template-${template.id}`}
                        checked={selectedTemplateIds.includes(template.id)}
                        onChange={(e) => onTemplateSelect(template.id, e.target.checked)}
                        className={`mt-1 h-4 w-4 text-${highlightColor}-600 border-gray-300 rounded`}
                      />
                      <div className="ml-3 flex-1">
                        <label htmlFor={`${type}-template-${template.id}`} className="block text-sm font-medium text-gray-900">
                          {template.name}
                        </label>
                        <span className="block text-xs text-gray-500 mt-1">Type: {template.type}</span>
                      </div>
                      <button 
                        type="button"
                        className={`p-1 text-${highlightColor}-600 hover:bg-${highlightColor}-50 rounded-full`}
                        title="Edit Template"
                        onClick={() => handleEditTemplate(template.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {selectedTemplateIds.includes(template.id) && (
                      <div className="mt-2 pl-7">
                        <div className="bg-gray-50 p-2 rounded-md">
                          {type === 'email' && (
                            <>
                              <p className="text-xs font-medium text-gray-700">Subject: {(template as EmailTemplate).subject}</p>
                              <p className="text-xs text-gray-600 mt-1">{(template as EmailTemplate).body.substring(0, 100)}...</p>
                            </>
                          )}
                          
                          {type === 'sms' && (
                            <p className="text-xs text-gray-600">{(template as SmsTemplate).message}</p>
                          )}
                          
                          {type === 'voicemail' && (
                            <div>
                              <div className="flex items-center mb-2">
                                <button
                                  type="button"
                                  className={`p-1 ${isPlaying === template.id ? 'bg-red-100 text-red-700' : `bg-${highlightColor}-100 text-${highlightColor}-700`} rounded-full`}
                                  title={isPlaying === template.id ? 'Stop' : 'Play Voicemail'}
                                  onClick={() => handlePlayAudio(template.id, (template as VoicemailTemplate).audioUrl)}
                                >
                                  {isPlaying === template.id ? (
                                    <XMarkIcon className="h-4 w-4" />
                                  ) : (
                                    <HeroPlayIcon className="h-4 w-4" />
                                  )}
                                </button>
                                <span className="text-xs text-gray-500 ml-2">
                                  {(template as VoicemailTemplate).duration 
                                    ? `${Math.floor((template as VoicemailTemplate).duration! / 60)}:${String((template as VoicemailTemplate).duration! % 60).padStart(2, '0')}`
                                    : '0:00'
                                  }
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{(template as VoicemailTemplate).transcription.substring(0, 100)}...</p>
                            </div>
                          )}
                          
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Send Delay:</span>
                              <select 
                                className="text-xs p-1 border border-gray-300 rounded"
                                value={template.sendDelay || 0}
                                onChange={(e) => {
                                  const updatedTemplate = { 
                                    ...template, 
                                    sendDelay: parseInt(e.target.value) 
                                  };
                                  onSaveTemplate(updatedTemplate as any);
                                }}
                              >
                                <option value={0}>Immediately</option>
                                <option value={24}>After 1 day</option>
                                <option value={48}>After 2 days</option>
                                <option value={72}>After 3 days</option>
                                <option value={168}>After 1 week</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTemplateId.startsWith('new_') ? 'Create New Template' : 'Edit Template'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editedTemplate.name}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={editedTemplate.type}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="introduction">Introduction</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="property-info">Property Info</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Email-specific fields */}
              {type === 'email' && (
                <>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Line*
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={(editedTemplate as EmailTemplate).subject}
                      onChange={handleChange}
                      className={`w-full p-2 border rounded-md ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                  </div>

                  <div>
                    <label htmlFor="previewText" className="block text-sm font-medium text-gray-700 mb-1">
                      Preview Text
                    </label>
                    <input
                      type="text"
                      id="previewText"
                      name="previewText"
                      value={(editedTemplate as EmailTemplate).previewText || ''}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Text shown in email client previews"
                    />
                  </div>

                  <div>
                    <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Body*
                    </label>
                    <textarea
                      id="body"
                      name="body"
                      value={(editedTemplate as EmailTemplate).body}
                      onChange={handleChange}
                      rows={8}
                      className={`w-full p-2 border rounded-md ${errors.body ? 'border-red-500' : 'border-gray-300'}`}
                    ></textarea>
                    {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
                    
                    <div className="mt-2 text-sm text-gray-500">
                      <p className="font-medium mb-1">Available Variables:</p>
                      <div className="flex flex-wrap gap-2">
                        {variableTags.email.map(variable => (
                          <button
                            key={variable}
                            type="button"
                            className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                            onClick={() => insertVariable('body', variable)}
                          >
                            {`{{${variable}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* SMS-specific fields */}
              {type === 'sms' && (
                <>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message*
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={(editedTemplate as SmsTemplate).message}
                      onChange={handleChange}
                      rows={4}
                      maxLength={160}
                      className={`w-full p-2 border rounded-md ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                    ></textarea>
                    <div className="flex justify-between mt-1">
                      <span className={`text-sm ${(editedTemplate as SmsTemplate).message?.length > 160 ? 'text-red-600' : 'text-gray-500'}`}>
                        {(editedTemplate as SmsTemplate).message?.length || 0}/160 characters
                      </span>
                      {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      <p className="font-medium mb-1">Available Variables:</p>
                      <div className="flex flex-wrap gap-2">
                        {variableTags.sms.map(variable => (
                          <button
                            key={variable}
                            type="button"
                            className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                            onClick={() => insertVariable('message', variable)}
                          >
                            {`{{${variable}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center">
                      <input
                        type="checkbox"
                        id="includeLink"
                        name="includeLink"
                        checked={(editedTemplate as SmsTemplate).includeLink || false}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label htmlFor="includeLink" className="ml-2 block text-sm text-gray-700">
                        Include property link in message
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Voicemail-specific fields */}
              {type === 'voicemail' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audio Recording
                    </label>
                    <div className="border border-gray-200 rounded-md p-3">
                      {!audioBlob && !editedTemplate.audioUrl ? (
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={isRecording ? stopRecording : startRecording}
                              className={`p-2 ${isRecording ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} rounded-full hover:bg-opacity-80`}
                            >
                              {isRecording ? <XMarkIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
                            </button>
                            <span className="text-sm text-gray-600">
                              {isRecording 
                                ? `Recording: ${Math.floor(recordingTime / 60)}:${String(recordingTime % 60).padStart(2, '0')}`
                                : 'Click to start recording'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-center border-t border-dashed border-gray-200 pt-3">
                            <label className="flex flex-col items-center cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                              <DocumentTextIcon className="h-5 w-5 mb-1" />
                              <span>Or upload audio file</span>
                              <input 
                                type="file"
                                className="hidden"
                                accept="audio/*"
                                onChange={handleFileUpload}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handlePlayAudio(editedTemplate.id, editedTemplate.audioUrl)}
                                className={`p-1 ${isPlaying === editedTemplate.id ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} rounded-full`}
                              >
                                {isPlaying === editedTemplate.id ? <XMarkIcon className="h-4 w-4" /> : <HeroPlayIcon className="h-4 w-4" />}
                              </button>
                              <span className="text-sm text-gray-600">
                                {editedTemplate.duration 
                                  ? `Duration: ${Math.floor(editedTemplate.duration / 60)}:${String(editedTemplate.duration % 60).padStart(2, '0')}`
                                  : 'Audio ready for playback'
                                }
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAudioBlob(null);
                                setEditedTemplate(prev => ({
                                  ...prev,
                                  audioUrl: '',
                                  duration: undefined
                                }));
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Transcription*
                      </label>
                      <div className="flex space-x-1">
                        {variableTags.voicemail.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => insertVariable('transcription', tag)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      name="transcription"
                      value={editedTemplate.transcription}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full p-2 border ${errors.transcription ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    />
                    {errors.transcription && <p className="mt-1 text-sm text-red-500">{errors.transcription}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voice Type
                    </label>
                    <select
                      name="voiceType"
                      value={editedTemplate.voiceType || 'ai'}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="male">Male Voice</option>
                      <option value="female">Female Voice</option>
                      <option value="ai">AI Voice</option>
                    </select>
                  </div>
                </>
              )}

              {/* Common fields for all template types */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sendDelay" className="block text-sm font-medium text-gray-700 mb-1">
                    Send Delay
                  </label>
                  <select
                    id="sendDelay"
                    name="sendDelay"
                    value={editedTemplate.sendDelay || 0}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value={0}>Immediately</option>
                    <option value={24}>After 1 day</option>
                    <option value={48}>After 2 days</option>
                    <option value={72}>After 3 days</option>
                    <option value={168}>After 1 week</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sendTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Best Time to Send
                  </label>
                  <select
                    id="sendTime"
                    name="sendTime"
                    value={editedTemplate.sendTime || 'morning'}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="morning">Morning (9 AM - 11 AM)</option>
                    <option value="afternoon">Afternoon (1 PM - 3 PM)</option>
                    <option value="evening">Evening (6 PM - 8 PM)</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`px-4 py-2 bg-${highlightColor}-600 text-white rounded-md hover:bg-${highlightColor}-700 inline-flex items-center`}
                >
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                  Save Template
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Voicemail template edit form */}
      {editingTemplateId && type === 'voicemail' && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-base font-medium text-gray-800 mb-4">
            {editedTemplate.id.startsWith('new_') ? 'Create New Voicemail Template' : 'Edit Voicemail Template'}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name*
              </label>
              <input 
                type="text"
                name="name"
                value={editedTemplate.name}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio Recording
              </label>
              <div className="border border-gray-200 rounded-md p-3">
                {!audioBlob && !editedTemplate.audioUrl ? (
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 ${isRecording ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} rounded-full hover:bg-opacity-80`}
                      >
                        {isRecording ? <XMarkIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
                      </button>
                      <span className="text-sm text-gray-600">
                        {isRecording 
                          ? `Recording: ${Math.floor(recordingTime / 60)}:${String(recordingTime % 60).padStart(2, '0')}`
                          : 'Click to start recording'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center border-t border-dashed border-gray-200 pt-3">
                      <label className="flex flex-col items-center cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        <DocumentTextIcon className="h-5 w-5 mb-1" />
                        <span>Or upload audio file</span>
                        <input 
                          type="file"
                          className="hidden"
                          accept="audio/*"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(editedTemplate.id, editedTemplate.audioUrl)}
                          className={`p-1 ${isPlaying === editedTemplate.id ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} rounded-full`}
                        >
                          {isPlaying === editedTemplate.id ? <XMarkIcon className="h-4 w-4" /> : <HeroPlayIcon className="h-4 w-4" />}
                        </button>
                        <span className="text-sm text-gray-600">
                          {editedTemplate.duration 
                            ? `Duration: ${Math.floor(editedTemplate.duration / 60)}:${String(editedTemplate.duration % 60).padStart(2, '0')}`
                            : 'Audio ready for playback'
                          }
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAudioBlob(null);
                          setEditedTemplate(prev => ({
                            ...prev,
                            audioUrl: '',
                            duration: undefined
                          }));
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Transcription*
                </label>
                <div className="flex space-x-1">
                  {variableTags.voicemail.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariable('transcription', tag)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                name="transcription"
                value={editedTemplate.transcription}
                onChange={handleChange}
                rows={4}
                className={`w-full p-2 border ${errors.transcription ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.transcription && <p className="mt-1 text-sm text-red-500">{errors.transcription}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voice Type
              </label>
              <select
                name="voiceType"
                value={editedTemplate.voiceType || 'ai'}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="male">Male Voice</option>
                <option value="female">Female Voice</option>
                <option value="ai">AI Voice</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Type
              </label>
              <select
                name="type"
                value={editedTemplate.type}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="introduction">Introduction</option>
                <option value="follow-up">Follow-up</option>
                <option value="property-info">Property Info</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send Delay (hours)
              </label>
              <input 
                type="number"
                name="sendDelay"
                value={editedTemplate.sendDelay || ''}
                onChange={handleChange}
                min="0"
                placeholder="0 (send immediately)"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-4 py-2 bg-${highlightColor}-600 text-white rounded-md hover:bg-${highlightColor}-700`}
            >
              Save Template
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden audio element for voicemail playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

// Helper component for the play icon
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
  );
} 