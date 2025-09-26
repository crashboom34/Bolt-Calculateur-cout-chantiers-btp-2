import { useState } from 'react';
import { estimerChantier, type EstimationResponse, type PosteTravail } from '../domain/api';
export default function EstimerButton({ postes, onDone, onError }:{ postes:PosteTravail[]; onDone:(r:EstimationResponse)=>void; onError:(m:string)=>void; }) {
  const [loading, setLoading] = useState(false);
  return <button disabled={loading} onClick={async()=>{
    if (loading) return; setLoading(true);
    try { const r=await estimerChantier({ postes }); onDone(r); }
    catch(e:any){ onError(e?.message||'Erreur inconnue'); }
    finally{ setLoading(false); }
  }}>{loading?'Estimation…':'Estimer via API'}</button>;
}
