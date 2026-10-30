export type View = 'day' | 'month' | 'year' | 'important';

export type Note = {
  _id: string;
  body: string;
  photoIds: string[];
  photoUrls: string[];
  important: boolean;
  createdAt: number;
  ownerId: string;
  isLocked?: boolean;
  tags?: string[];
};

export type DraftPhoto =
  | { kind: 'stored'; storageId: string; url: string }
  | { kind: 'new'; uri: string; mimeType?: string };
