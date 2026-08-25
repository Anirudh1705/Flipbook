import { useState, useEffect } from 'react';
import type { Book } from '../types/book';
import { supabase, isSupabaseConfigured, getLocalBooks } from '../lib/supabase';

export function useBookBySlug(slug?: string) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadBook() {
      setLoading(true);
      setError(null);

      const rawSlug = slug || '';
      const cleanSlug = rawSlug.toLowerCase().trim();
      const parsedNum = parseInt(cleanSlug.replace(/^book-?/i, ''), 10);

      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Try match by exact slug
          const query = supabase.from('books').select('*').eq('slug', cleanSlug);
          let { data } = await query.maybeSingle();

          // 2. If not found and slug is numeric / book-01 format, try match by book_number
          if (!data && !isNaN(parsedNum)) {
            const numQuery = await supabase.from('books').select('*').eq('book_number', parsedNum).maybeSingle();
            data = numQuery.data;
          }

          if (data && isMounted) {
            setBook(data);
            setLoading(false);
            return;
          }
        }

        // Fallback or search in local dataset
        const localBooks = getLocalBooks();
        const found = localBooks.find(b => {
          const bSlug = b.slug.toLowerCase();
          const bNum = b.book_number;
          const bNumPadded = String(bNum).padStart(2, '0');
          return (
            bSlug === cleanSlug ||
            `book-${bNumPadded}` === cleanSlug ||
            `book-${bNum}` === cleanSlug ||
            String(bNum) === cleanSlug ||
            bNumPadded === cleanSlug ||
            (!isNaN(parsedNum) && bNum === parsedNum)
          );
        });

        if (isMounted) {
          if (found) {
            setBook(found);
          } else {
            setError(`Publication "${slug}" not found.`);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading publication');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBook();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { book, loading, error };
}
