import { useEffect, useState } from 'react';
import { fetchDataSources, fetchRawRecordCounts, formatFreshness } from '@/lib/realData';
import { VerificationBadge } from '@/components/terra/DataStatus';

export function SyncStatusScreen({ onNav }) {
  const [sources, setSources] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([fetchDataSources(), fetchRawRecordCounts()]);
      setSources(s);
      setCounts(c);
    })();
  }, []);

  return (
    <div className="topo min-h-full pb-8">
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => onNav('profile')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="pill-orange inline-block mb-2">Data Pipeline</span>
        <h1 className="font-sans text-2xl font-800 text-white">Sync Status</h1>
        <p className="font-sans text-white/45 text-sm">Every external source registered and its last fetch state.</p>
      </div>

      <div className="px-4">
        {sources === null ? (
          <div className="card-dark p-4 text-center">
            <div className="w-6 h-6 mx-auto border-4 border-white/20 border-t-app-orange rounded-full animate-spin" />
          </div>
        ) : sources.length === 0 ? (
          <div className="card-dark p-6 text-center">
            <p className="font-sans text-white/50 text-sm">No data sources registered yet.</p>
            <p className="font-mono text-[10px] text-white/30 mt-1">Ingestion endpoints will appear here once real sources are connected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((s) => {
              const c = counts[s.source_name] || { fetched: 0, processed: 0, rejected: 0, errors: 0 };
              return (
                <div key={s.id} className="card-dark p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      <p className="font-sans text-white font-700 text-sm truncate">{s.source_name}</p>
                      <p className="font-mono text-[9px] text-white/35 truncate">{s.base_url || '—'}</p>
                    </div>
                    <VerificationBadge status={s.status === 'active' ? 'verified' : s.status === 'degraded' ? 'pending_verification' : 'source_unavailable'} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                    <Cell label="Fetched" value={c.fetched} />
                    <Cell label="Added" value={c.processed} accent />
                    <Cell label="Rejected" value={c.rejected} />
                    <Cell label="Errors" value={c.errors} danger={c.errors > 0} />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                    <span className="font-mono text-[9px] text-white/40">{formatFreshness(s.last_successful_fetch)}</span>
                    <span className="font-mono text-[9px] text-white/30">freq: {s.update_frequency || '—'}</span>
                  </div>
                  {s.error_message && (
                    <p className="font-mono text-[9px] text-app-red mt-2 break-words">{s.error_message}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="card-surface p-4 mt-4">
          <p className="font-sans text-white/50 text-xs uppercase tracking-widest font-600 mb-2">Data Integrity Rule</p>
          <p className="font-sans text-white/70 text-xs leading-relaxed">
            No synthetic, mock, or fallback values are ever displayed. When a source cannot be reached, the affected metric shows <span className="text-app-amber font-700">"Data unavailable"</span> and the last verified record (if any) is preserved with its original timestamp.
          </p>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, accent, danger }) {
  return (
    <div>
      <p className={`font-mono text-sm font-700 ${danger ? 'text-app-red' : accent ? 'text-app-orange' : 'text-white'}`}>{value}</p>
      <p className="font-sans text-[9px] text-white/40">{label}</p>
    </div>
  );
}