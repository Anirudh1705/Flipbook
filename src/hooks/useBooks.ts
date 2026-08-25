import { useState, useEffect, useCallback } from 'react';
import type { Book } from '../types/book';
import { supabase, isSupabaseConfigured, getLocalBooks, saveLocalBooks } from '../lib/supabase';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      // Fallback to local memory / storage dataset
      const local = getLocalBooks();
      setBooks(local.sort((a, b) => a.display_order - b.display_order));
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('books')
        .select('*')
        .order('display_order', { ascending: true });

      if (dbError) throw dbError;
      if (data && data.length > 0) {
        setBooks(data);
      } else {
        // If table is empty, load local default dataset
        const local = getLocalBooks();
        setBooks(local);
      }
    } catch (err: any) {
      console.warn('Supabase fetch failed, using fallback data:', err);
      const local = getLocalBooks();
      setBooks(local);
      setError(err.message || 'Failed to fetch publications from Supabase');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const saveBook = async (bookData: Partial<Book> & { id?: string }): Promise<Book> => {
    if (!isSupabaseConfigured || !supabase) {
      // Save locally
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
    }

    // Save to Supabase
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
  };

  const deleteBook = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) {
      const current = getLocalBooks();
      const updated = current.filter(b => b.id !== id);
      saveLocalBooks(updated);
      setBooks(updated);
      return;
    }

    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
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
