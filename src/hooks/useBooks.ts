import { useState, useEffect, useCallback } from 'react';
import type { Book } from '../types/book';
import {
  isFirebaseConfigured,
  getBooksFromFirestore,
  saveBookToFirestore,
  deleteBookFromFirestore,
} from '../lib/firebase';
import { supabase, isSupabaseConfigured, getLocalBooks, saveLocalBooks } from '../lib/supabase';
import { deletePdfFromStorage } from '../lib/pdfStorage';

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
        setBooks(firestoreBooks);
        saveLocalBooks(firestoreBooks);
        setLoading(false);
        return;
      } catch (err: any) {
        console.warn('Firebase fetch failed, falling back to local:', err);
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
        if (data) {
          setBooks(data);
          saveLocalBooks(data);
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
    const nextNumber =
      bookData.book_number ||
      (books.length > 0
        ? Math.max(...books.map(b => Number(b.book_number) || 0)) + 1
        : 1);

    const payload: Partial<Book> = {
      ...bookData,
      book_number: nextNumber,
      display_order: bookData.display_order || nextNumber,
    };

    // 1. Firebase Firestore
    if (isFirebaseConfigured) {
      const saved = await saveBookToFirestore(payload);
      // Sync local storage
      const current = getLocalBooks();
      const exists = current.some(b => b.id === saved.id);
      const updatedLocal = exists
        ? current.map(b => (b.id === saved.id ? saved : b))
        : [...current, saved];
      saveLocalBooks(updatedLocal);
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
        page_count: bookData.page_count ?? 0,
        file_size: bookData.file_size ?? 0,
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
    // Optimistically update UI
    setBooks(prev => prev.filter(b => b.id !== id));

    // Remove local storage
    const current = getLocalBooks();
    const target = current.find(b => b.id === id);
    if (target?.pdf_url?.startsWith('idb://')) {
      try {
        await deletePdfFromStorage(target.pdf_url);
      } catch {}
    }
    const updatedLocal = current.filter(b => b.id !== id);
    saveLocalBooks(updatedLocal);

    // 1. Firebase Firestore
    if (isFirebaseConfigured) {
      try {
        await deleteBookFromFirestore(id);
      } catch (err) {
        console.warn('Firestore deletion failed:', err);
      }
    }

    // 2. Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('books').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deletion failed:', err);
      }
    }

    await fetchBooks();
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
