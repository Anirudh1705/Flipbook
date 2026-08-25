import React from 'react';
import { useParams } from 'react-router-dom';
import { useBookBySlug } from '../hooks/useBookBySlug';
import { usePdfDocument } from '../hooks/usePdfDocument';
import { FlipbookViewer } from '../components/pdf/FlipbookViewer';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { SEO } from '../components/common/SEO';

export const BookViewerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { book, loading: bookLoading, error: bookError } = useBookBySlug(slug);

  // Initialize PDF.js with byte range requests using the publication's PDF URL
  const {
    pdfDocument,
    loading: pdfLoading,
    progress,
    progressStage,
    error: pdfError,
    retry,
  } = usePdfDocument(book?.pdf_url);

  if (bookLoading) {
    return (
      <LoadingScreen
        progress={10}
        stageText="Looking up publication metadata from Supabase..."
      />
    );
  }

  if (bookError || !book) {
    return (
      <LoadingScreen
        error={bookError || `Publication "/book/${slug}" was not found.`}
        title="Publication Not Found"
      />
    );
  }

  if (pdfLoading || !pdfDocument) {
    return (
      <>
        <SEO
          title={`${book.title} | Flipbook Reader`}
          description={book.description}
          image={book.cover_url}
        />
        <LoadingScreen
          progress={progress}
          stageText={progressStage}
          error={pdfError}
          onRetry={retry}
          title={book.title}
        />
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${book.title} | Flipbook Reader`}
        description={book.description}
        image={book.cover_url}
      />
      <FlipbookViewer book={book} pdfDocument={pdfDocument} />
    </>
  );
};
