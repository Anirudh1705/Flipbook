import { useState, useEffect } from 'react';
import type { Book } from '../types/book';
import { isFirebaseConfigured, getBooksFromFirestore } from '../lib/firebase';
import { supabase, isSupabaseConfigured, getLocalBooks } from '../lib/supabase';

function matchBook(book: Book, cleanSlug: string, parsedNum: number): boolean {
  if (!book) return false;
  const bSlug = (book.slug || '').toLowerCase().trim();
  const bNum = Number(book.book_number);
  const bNumPadded = !isNaN(bNum) ? String(bNum).padStart(2, '0') : '';
  const bId = String(book.id || '').toLowerCase().trim();

  return (
    bSlug === cleanSlug ||
    (bNumPadded !== '' && `book-${bNumPadded}` === cleanSlug) ||
    (!isNaN(bNum) && `book-${bNum}` === cleanSlug) ||
    (!isNaN(bNum) && String(bNum) === cleanSlug) ||
    (bNumPadded !== '' && bNumPadded === cleanSlug) ||
    (!isNaN(parsedNum) && !isNaN(bNum) && bNum === parsedNum) ||
    bId === cleanSlug
  );
}

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
        // 1. Firebase Firestore
        if (isFirebaseConfigured) {
          try {
            const firestoreBooks = await getBooksFromFirestore();
            const found = firestoreBooks.find(b => matchBook(b, cleanSlug, parsedNum));
            if (found && isMounted) {
              setBook(found);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn('Firestore lookup error:', err);
          }
        }

        // 2. Supabase
        if (isSupabaseConfigured && supabase) {
          try {
            const query = supabase.from('books').select('*').eq('slug', cleanSlug);
            let { data } = await query.maybeSingle();

            if (!data && !isNaN(parsedNum)) {
              const numQuery = await supabase
                .from('books')
                .select('*')
                .eq('book_number', parsedNum)
                .maybeSingle();
              data = numQuery.data;
            }

            if (data && isMounted) {
              setBook(data);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn('Supabase lookup error:', err);
          }
        }

        // 3. Fallback to local dataset / IndexedDB
        const localBooks = getLocalBooks();
        const found = localBooks.find(b => matchBook(b, cleanSlug, parsedNum));

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
