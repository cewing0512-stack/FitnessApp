import { Link } from 'react-router';

/** Placeholder for screens that arrive in later build phases. */
export function ComingSoon({ title, phase, back }: { title: string; phase?: number; back?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="text-[34px] font-bold tracking-tight">{title}</h1>
      <div className="mt-8 rounded-3xl border border-dashed border-line px-6 py-12 text-center text-white/55">
        {phase ? `Coming in Phase ${phase}.` : 'This page doesn\u2019t exist.'}
        {back && (
          <Link to={back} className="mt-5 block font-medium text-white underline underline-offset-4">
            Go back
          </Link>
        )}
      </div>
    </div>
  );
}
