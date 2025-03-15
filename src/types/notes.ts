export interface ContactNote {
  id: string;
  body: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesResponse {
  notes: ContactNote[];
  meta?: {
    total: number;
    nextPageUrl?: string;
  };
}

export interface NoteResponse {
  note: ContactNote;
}

export interface NoteCreatePayload {
  body: string;
  userId?: string;
}

export interface NoteUpdatePayload {
  body: string;
  userId?: string;
} 