import { useState, useEffect, useCallback } from 'react';
import type { Book } from '../types/book';
import {
  isFirebaseConfigured,
  getBooksFromFirestore,
  saveBookToFirestore,
  deleteBookFromFirestore,
} from '../lib/firebase';
import { supabase, isSupabaseConfigured, getLocalBooks, saveLocalBooks } from '../lib/supabase';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Firebase Firestore Mode
    if (isFirebaseConfigured) {
      try {
        const firestoreBooks = await getBooksFromFirestore();
        if (firestoreBooks.length > 0) {
          setBooks(firestoreBooks);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn('Firebase fetch failed, falling back:', err);
      }
    }

    // 2. Supabase Mode
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: dbError } = await supabase
          .from('books')
          .select('*')
          .order('display_order', { ascending: true });

        if (dbError) throw dbError;
        if (data && data.length > 0) {
          setBooks(data);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn('Supabase fetch failed, falling back:', err);
      }
    }

    // 3. Client-side Local Storage & IndexedDB Fallback
    const local = getLocalBooks();
    setBooks(local.sort((a, b) => a.display_order - b.display_order));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const saveBook = async (bookData: Partial<Book> & { id?: string }): Promise<Book> => {
    // 1. Firebase Firestore
    if (isFirebaseConfigured) {
      const saved = await saveBookToFirestore(bookData);
      await fetchBooks();
      return saved;
    }

    // 2. Supabase
    if (isSupabaseConfigured && supabase) {
      if (bookData.id) {
        const { data, error: updateError } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', bookData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        await fetchBooks();
        return data;
      } else {
        const { data, error: insertError } = await supabase
          .from('books')
          .insert([bookData])
          .select()
          .single();

        if (insertError) throw insertError;
        await fetchBooks();
        return data;
      }
    }

    // 3. Local fallback
    const current = getLocalBooks();
    let updated: Book[];
    let savedItem: Book;

    if (bookData.id) {
      updated = current.map(b => (b.id === bookData.id ? ({ ...b, ...bookData } as Book) : b));
      savedItem = updated.find(b => b.id === bookData.id)!;
    } else {
      savedItem = {
        ...bookData,
        id: String(Date.now()),
        book_number: current.length + 1,
        display_order: current.length + 1,
        is_published: bookData.is_published ?? true,
        page_count: bookData.page_count ?? 14,
        file_size: bookData.file_size ?? 1048576,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Book;
      updated = [...current, savedItem];
    }

    saveLocalBooks(updated);
    setBooks(updated.sort((a, b) => a.display_order - b.display_order));
    return savedItem;
  };

  const deleteBook = async (id: string): Promise<void> => {
    // 1. Firebase Firestore
    if (isFirebaseConfigured) {
      await deleteBookFromFirestore(id);
      await fetchBooks();
      return;
    }

    // 2. Supabase
    if (isSupabaseConfigured && supabase) {
      const { error: deleteError } = await supabase.from('books').delete().eq('id', id);
      if (deleteError) throw deleteError;
      await fetchBooks();
      return;
    }

    // 3. Local
    const current = getLocalBooks();
    const updated = current.filter(b => b.id !== id);
    saveLocalBooks(updated);
    setBooks(updated);
  };

  const togglePublish = async (id: string, currentStatus: boolean): Promise<void> => {
    await saveBook({ id, is_published: !currentStatus });
  };

  return {
    books,
    loading,
    error,
    refetch: fetchBooks,
    saveBook,
    deleteBook,
    togglePublish,
  };
}
