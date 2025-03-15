'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, ChevronLeft, Plus } from 'lucide-react';
import { ContactNote } from '@/types/notes';
import { getContactNotes, createContactNote, updateContactNote, deleteContactNote } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface NoteSidebarProps {
  contactId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NoteSidebar({ contactId, isOpen, onClose }: NoteSidebarProps) {
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<ContactNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && contactId) {
      fetchNotes();
    }
  }, [isOpen, contactId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getContactNotes(contactId);
      setNotes(response.notes || []);
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!noteBody.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await createContactNote(contactId, {
        body: noteBody,
        userId: user?.id,
      });
      
      // Add the new note to the list
      setNotes([response.note, ...notes]);
      setNoteBody('');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to create note');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !noteBody.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await updateContactNote(contactId, selectedNote.id, {
        body: noteBody,
        userId: user?.id,
      });
      
      // Update the note in the list
      setNotes(notes.map(note => 
        note.id === selectedNote.id ? response.note : note
      ));
      setNoteBody('');
      setSelectedNote(null);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update note');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setIsLoading(true);
      setError(null);
      try {
        await deleteContactNote(contactId, noteId);
        
        // Remove the note from the list
        setNotes(notes.filter(note => note.id !== noteId));
        
        // Reset state if the deleted note was selected
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setNoteBody('');
          setIsEditing(false);
        }
      } catch (err) {
        setError('Failed to delete note');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditNote = (note: ContactNote) => {
    setSelectedNote(note);
    setNoteBody(note.body);
    setIsEditing(true);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setNoteBody('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSelectedNote(null);
    setNoteBody('');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-md flex flex-col z-20 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Notes ({notes.length})</h2>
        <div className="flex">
          {!isEditing && (
            <button
              onClick={handleNewNote}
              className="p-2 rounded-full hover:bg-gray-100 mr-2"
              aria-label="Add note"
            >
              <Plus size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && notes.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        ) : isEditing ? (
          <div className="mb-4">
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[120px]"
              placeholder="Write your note here..."
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={selectedNote ? handleUpdateNote : handleCreateNote}
                disabled={!noteBody.trim() || isLoading}
                className={`px-3 py-1 text-sm rounded-md ${
                  !noteBody.trim() || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isLoading ? 'Saving...' : selectedNote ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        ) : selectedNote ? (
          <div className="mb-4">
            <button
              onClick={() => setSelectedNote(null)}
              className="flex items-center text-sm text-purple-600 mb-2"
            >
              <ChevronLeft size={16} />
              <span>Back to all notes</span>
            </button>
            <div className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500">
                  {formatDate(selectedNote.updatedAt || selectedNote.createdAt)}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditNote(selectedNote)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <Edit2 size={14} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <Trash2 size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{selectedNote.body}</p>
            </div>
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="border border-gray-200 rounded-md p-3 cursor-pointer hover:border-purple-300"
              >
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    {formatDate(note.updatedAt || note.createdAt)}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNote(note);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Trash2 size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                <p className="text-sm truncate mt-1">{note.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <p className="mb-4">No notes yet</p>
            <button
              onClick={handleNewNote}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add a note
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 