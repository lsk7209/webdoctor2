import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('@/components/navigation'), {
  ssr: false,
});

export const dynamic = 'force-dynamic';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}

