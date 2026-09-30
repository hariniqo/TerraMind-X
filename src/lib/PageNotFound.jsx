const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await db.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <section className="w-full max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-500">404</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
                <p className="mt-3 text-sm text-slate-600">
                    {pageName ? `We could not find “${pageName}”.` : 'This page does not exist.'}
                </p>
                <Link className="mt-5 inline-flex text-sm font-medium text-primary hover:underline" to="/">
                    Return home
                </Link>
            </section>
        </div>
    );
}