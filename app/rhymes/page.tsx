import RhymePlayer from '@/components/rhymes/RhymePlayer';

export const metadata = {
  title: 'Rhymes — Saeshify',
  description: 'Real-time rhyme scheme visualization synced with Spotify',
};

export default function RhymesPage() {
  return (
    <div className="h-full flex flex-col bg-[#121212]">
      <RhymePlayer />
    </div>
  );
}
