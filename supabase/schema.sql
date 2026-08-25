-- ==============================================================================
-- DIGITAL FLIPBOOK LIBRARY - SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. Create books table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_number INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_url TEXT,
    pdf_url TEXT NOT NULL,
    category TEXT,
    author TEXT,
    publication_date DATE,
    page_count INTEGER DEFAULT 0,
    file_size BIGINT DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books(slug);
CREATE INDEX IF NOT EXISTS idx_books_published_order ON public.books(is_published, display_order);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_book_number ON public.books(book_number);

-- 3. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Row Level Security (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Public Policy: Anyone can read published books
CREATE POLICY "Allow public read access on published books"
    ON public.books
    FOR SELECT
    USING (is_published = true);

-- Authenticated/Admin Policies: Full CRUD for authenticated users (Admins)
CREATE POLICY "Allow authenticated users to read all books"
    ON public.books
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert books"
    ON public.books
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update books"
    ON public.books
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete books"
    ON public.books
    FOR DELETE
    TO authenticated
    USING (true);

-- 5. Seed Data (25 Curated Publications ready to view)
INSERT INTO public.books (book_number, title, slug, description, cover_url, pdf_url, category, author, publication_date, page_count, file_size, is_published, display_order)
VALUES
(1, 'Global Horizons: Annual Innovation Report 2026', 'annual-report-2026', 'A comprehensive study on emerging technology trends, AI acceleration, sustainable infrastructure, and global market dynamics.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Technology & Business', 'Horizon Research Institute', '2026-01-15', 14, 1048576, true, 1),
(2, 'Architectural Digest: Sustainable Mega-Structures', 'architectural-digest-sustainable-structures', 'Exploring biophilic skyscrapers, timber engineering, and zero-carbon urban habitats across five continents.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Architecture & Design', 'Elena Rostova & Studio Arch', '2026-02-10', 14, 2097152, true, 2),
(3, 'Deep Space Odyssey: James Webb Frontiers', 'deep-space-odyssey', 'High-resolution photometric data, cosmic dawn surveys, and spectroscopy results from deep galactic clusters.', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Science & Astrophysics', 'Astrophysical Sciences Council', '2026-03-01', 14, 4194304, true, 3),
(4, 'The Art of Typography & Editorial Layout', 'art-of-typography', 'A visual celebration of modernist grids, Swiss design principles, serif evolution, and digital editorial mastery.', 'https://images.unsplash.com/photo-1507842229451-79b1be046a22?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Visual Arts', 'Marcus Vance', '2025-11-20', 14, 3145728, true, 4),
(5, 'Quantum Computing: From Theory to Scalable Qubits', 'quantum-computing-principles', 'Technical analysis on topological qubits, quantum error mitigation, and cryptographic implications.', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Technology & Business', 'Dr. Aris Thorne', '2025-12-05', 14, 5242880, true, 5),
(6, 'Oceanic Conservation & Marine Biodiversity', 'oceanic-conservation-review', 'Global coral reef restoration surveys, benthic ecosystem health indices, and marine protected zone metrics.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Environment & Ecology', 'Pacific Marine Institute', '2025-10-18', 14, 4718592, true, 6),
(7, 'Monograph: Minimalism in Contemporary Japanese Design', 'minimalism-japanese-design', 'An intimate examination of Ma (negative space), joinery traditions, and wabi-sabi philosophy in modern industrial items.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Visual Arts', 'Kenji Sato', '2025-09-14', 14, 2621440, true, 7),
(8, 'Renewable Energy Grid Orchestration 2030', 'renewable-energy-orchestration', 'Grid-scale battery storage, HVDC transmission networks, and AI dispatch algorithms for 100% clean power.', 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Environment & Ecology', 'Clean Grid Taskforce', '2025-08-30', 14, 3670016, true, 8),
(9, 'Neurobiology & Cognitive Augmented Interfaces', 'neurobiology-cognitive-interfaces', 'Neural decoding, non-invasive BCI bandwidth breakthroughs, and human-computer symbiosis paradigms.', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Science & Astrophysics', 'Dr. Sarah Lin', '2025-07-22', 14, 6291456, true, 9),
(10, 'Fintech Disruption & Autonomous Financial Systems', 'fintech-disruption-systems', 'Decentralized liquidity protocols, algorithmic settlement, and central bank digital currency frameworks.', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Technology & Business', 'Financial Engineering Review', '2025-06-11', 14, 3407872, true, 10),
(11, 'Urban Ecology: Rewilding Metropolitan Centers', 'urban-ecology-rewilding', 'Living walls, urban micro-forests, biodiversity corridors, and water-retaining sponge city infrastructure.', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Architecture & Design', 'Urban Nature Consortium', '2025-05-19', 14, 4194304, true, 11),
(12, 'Photography Annual: Light, Shadows & Silence', 'photography-annual-light-shadows', 'Curated selection of international monochrome landscape photography, darkroom techniques, and fine art prints.', 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Visual Arts', 'International Guild of Photography', '2025-04-15', 14, 7340032, true, 12),
(13, 'Synthetic Biology & Cellular Engineering', 'synthetic-biology-cellular-engineering', 'CRISPR base editing, metabolic pathway design for biomanufacturing, and synthetic cell chassis analysis.', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Science & Astrophysics', 'Biotech Science Press', '2025-03-28', 14, 5767168, true, 13),
(14, 'Autonomous Robotics: Perception & Dexterity', 'autonomous-robotics-perception', 'Reinforcement learning for manipulation, multi-modal sensor fusion, and humanoid biomechanics review.', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Technology & Business', 'Robotics Engineering Society', '2025-02-14', 14, 4980736, true, 14),
(15, 'The Nordic Architecture Manifesto', 'nordic-architecture-manifesto', 'Light calibration, sustainable mass timber, vernacular warmth, and social connectivity in Scandinavian homes.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Architecture & Design', 'Nordic Design Council', '2025-01-20', 14, 3932160, true, 15),
(16, 'Circular Economy & Closed-Loop Manufacturing', 'circular-economy-manufacturing', 'Zero-waste industrial symbiosis, biomaterials, polymer upcycling, and regenerative product lifecycle design.', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Environment & Ecology', 'Institute for Circular Design', '2024-12-08', 14, 2883584, true, 16),
(17, 'Sculptural Forms in Raw Concrete & Steel', 'sculptural-forms-concrete-steel', 'Brutalist heritage, expressive structural engineering, and modern tactile finishes in museum architecture.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Visual Arts', 'Claire Delacroix', '2024-11-12', 14, 3407872, true, 17),
(18, 'Genomics & Precision Oncology Quarterly', 'genomics-precision-oncology', 'Targeted immunotherapy markers, liquid biopsy diagnostics, and single-cell sequencing in clinical trials.', 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Science & Astrophysics', 'Medical Genetics Review', '2024-10-25', 14, 5242880, true, 18),
(19, 'Cybersecurity Threat Intelligence 2026', 'cybersecurity-threat-intelligence', 'Post-quantum encryption readiness, zero-trust perimeter telemetry, and autonomous cyber defense matrices.', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Technology & Business', 'Cyber Defense Alliance', '2024-09-18', 14, 4456448, true, 19),
(20, 'Contemporary Ceramic Art: Clay & Fire', 'contemporary-ceramic-art', 'Studio pottery retrospectives, wood-fired kilns, crystalline glazes, and modern organic porcelain works.', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Visual Arts', 'Sora Tanaka', '2024-08-04', 14, 3145728, true, 20),
(21, 'Agritech & Precision Indoor Farming', 'agritech-precision-farming', 'Vertical hydroponics, spectrum-tailored LED lighting, and computer vision nutrient monitoring for sustainable yield.', 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Environment & Ecology', 'Agricultural Futures Lab', '2024-07-16', 14, 3670016, true, 21),
(22, 'High-Speed Rail & Megacity Logistics', 'high-speed-rail-logistics', 'Maglev feasibility studies, aerodynamic pantograph dampening, and automated intermodal freight hubs.', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Architecture & Design', 'Transportation Research Forum', '2024-06-22', 14, 4718592, true, 22),
(23, 'Computational Linguistics & Neural Semantics', 'computational-linguistics-semantics', 'Vector embeddings geometry, multilingual tokenization alignment, and semantic reasoning evaluation.', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Technology & Business', 'Language Intelligence Group', '2024-05-10', 14, 3932160, true, 23),
(24, 'High-Altitude Wilderness Expeditions', 'high-altitude-expeditions', 'Alpine mountaineering chronicles, glaciology measurements, and extreme climate endurance gear analysis.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Environment & Ecology', 'Alpine Exploration Society', '2024-04-18', 14, 6815744, true, 24),
(25, 'The Future of Public Libraries in the Digital Era', 'future-of-public-libraries', 'Community knowledge commons, spatial acoustics, archive digitization, and democratic access to digital assets.', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop', 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', 'Architecture & Design', 'Library Sciences Foundation', '2024-03-30', 14, 3145728, true, 25)
ON CONFLICT (slug) DO UPDATE 
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    cover_url = EXCLUDED.cover_url,
    pdf_url = EXCLUDED.pdf_url,
    category = EXCLUDED.category,
    author = EXCLUDED.author,
    publication_date = EXCLUDED.publication_date,
    page_count = EXCLUDED.page_count,
    file_size = EXCLUDED.file_size,
    is_published = EXCLUDED.is_published,
    display_order = EXCLUDED.display_order;
