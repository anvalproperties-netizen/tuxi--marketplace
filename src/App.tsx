import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { TuxiProvider, useTuxi } from './context/TuxiContext';
import { TopBar } from './components/navigation/TopBar';
import { CustomerView } from './components/customer/CustomerView';
import { RepView } from './components/rep/RepView';
import { EatsOwnerView } from './components/owner/EatsOwnerView';
import { ShopOwnerView } from './components/owner/ShopOwnerView';
import { DriverView } from './components/driver/DriverView';
import { StandaloneAdminPortal } from './components/admin/StandaloneAdminPortal';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { PrivacyPolicyModal } from './components/common/PrivacyPolicyModal';
import { TermsOfServiceModal } from './components/common/TermsOfServiceModal';
import { DataSafetyModal } from './components/common/DataSafetyModal';
import { AccountDeletionModal } from './components/common/AccountDeletionModal';
import { StoreTestingReviewerHub } from './components/common/StoreTestingReviewerHub';
import { 
  getStoredGoogleMapsApiKey, 
  isValidGoogleMapsKey, 
  isGoogleMapsAuthFailed 
} from './utils/googleMapsConfig';

const checkIsAdminRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return path.startsWith('/admin') || hash.startsWith('#/admin') || hash.startsWith('#admin') || search.includes('view=admin');
};

const MainContent: React.FC = () => {
  const { activeRole } = useTuxi();

  return (
    <main className="flex-1 pb-16">
      {activeRole === 'customer' && <CustomerView />}
      {activeRole === 'rep' && <RepView />}
      {activeRole === 'eats_owner' && <EatsOwnerView />}
      {activeRole === 'shop_owner' && <ShopOwnerView />}
      {activeRole === 'driver' && <DriverView />}
    </main>
  );
};

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => getStoredGoogleMapsApiKey());
  const [authFailed, setAuthFailed] = useState<boolean>(() => isGoogleMapsAuthFailed());
  const [isAdminView, setIsAdminView] = useState<boolean>(() => checkIsAdminRoute());

  // Legal & Testing Modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [isDataSafetyOpen, setIsDataSafetyOpen] = useState<boolean>(false);
  const [isAccountDeletionOpen, setIsAccountDeletionOpen] = useState<boolean>(false);
  const [isStoreTestingOpen, setIsStoreTestingOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(checkIsAdminRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToMarketplace = () => {
    window.history.pushState(null, '', '/');
    setIsAdminView(false);
  };

  const navigateToAdmin = () => {
    window.history.pushState(null, '', '/admin');
    setIsAdminView(true);
  };

  useEffect(() => {
    const handleKeyUpdated = (e: any) => {
      setApiKey(e.detail || getStoredGoogleMapsApiKey());
      setAuthFailed(false);
    };

    const handleAuthFailure = () => {
      setAuthFailed(true);
    };

    window.addEventListener('gmp-key-updated', handleKeyUpdated);
    window.addEventListener('gmp-auth-failure', handleAuthFailure);
    return () => {
      window.removeEventListener('gmp-key-updated', handleKeyUpdated);
      window.removeEventListener('gmp-auth-failure', handleAuthFailure);
    };
  }, []);

  const canMountGoogleMaps = isValidGoogleMapsKey(apiKey) && !authFailed;

  const appContent = (
    <TuxiProvider>
      {isAdminView ? (
        <StandaloneAdminPortal onReturnToApp={navigateToMarketplace} />
      ) : (
        <div className="min-h-screen bg-[var(--bg-app)] dark:bg-slate-950 text-[var(--text-primary)] dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
          <TopBar />
          <MainContent />

          {/* Global Footer */}
          <footer className="bg-[var(--bg-primary)] dark:bg-slate-900 border-t border-[var(--border-primary)] dark:border-slate-800 py-6 text-xs text-[var(--text-secondary)] dark:text-slate-400 mt-auto transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight">TUXI Global Marketplace</span>
                  <span aria-hidden="true">·</span>
                  <span>Eats</span>
                  <span aria-hidden="true">·</span>
                  <span>Shop</span>
                  <span aria-hidden="true">·</span>
                  <span>Courier</span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>{canMountGoogleMaps ? 'Google Maps Platform Active' : 'Autonomous Geospatial Engine'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Multi-Role Handoff Compliant</span>
                </div>
              </div>

              {/* Regulatory, Privacy & Store Testing Links */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
                <div className="flex flex-wrap items-center gap-2.5 text-slate-500 dark:text-slate-400">
                  <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
                    Privacy Policy
                  </button>
                  <span>·</span>
                  <button onClick={() => setIsTermsOpen(true)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
                    Terms of Service
                  </button>
                  <span>·</span>
                  <button onClick={() => setIsDataSafetyOpen(true)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
                    Data Safety
                  </button>
                  <span>·</span>
                  <button onClick={() => setIsAccountDeletionOpen(true)} className="text-rose-600 hover:text-rose-500 transition-colors font-medium">
                    Delete Account &amp; Data
                  </button>
                  <span>·</span>
                  <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 dark:hover:text-slate-300 underline">
                    Public Policy URL
                  </a>
                  <span>·</span>
                  <a 
                    href="/admin" 
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToAdmin();
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 font-mono text-[10.5px] font-semibold text-slate-400 hover:underline"
                    title="Separate URL route for Autonomous AI Command Center"
                  >
                    Admin Portal (/admin)
                  </a>
                </div>

                <div>
                  <button
                    onClick={() => setIsStoreTestingOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5"
                  >
                    <span>Store Reviewer Testing Hub</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </button>
                </div>
              </div>

            </div>
          </footer>

          {/* Global Store Compliance Modals */}
          <PrivacyPolicyModal
            isOpen={isPrivacyOpen}
            onClose={() => setIsPrivacyOpen(false)}
            onOpenAccountDeletion={() => setIsAccountDeletionOpen(true)}
          />

          <TermsOfServiceModal
            isOpen={isTermsOpen}
            onClose={() => setIsTermsOpen(false)}
          />

          <DataSafetyModal
            isOpen={isDataSafetyOpen}
            onClose={() => setIsDataSafetyOpen(false)}
            onOpenAccountDeletion={() => setIsAccountDeletionOpen(true)}
          />

          <AccountDeletionModal
            isOpen={isAccountDeletionOpen}
            onClose={() => setIsAccountDeletionOpen(false)}
          />

          <StoreTestingReviewerHub
            isOpen={isStoreTestingOpen}
            onClose={() => setIsStoreTestingOpen(false)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenTerms={() => setIsTermsOpen(true)}
            onOpenDataSafety={() => setIsDataSafetyOpen(true)}
            onOpenAccountDeletion={() => setIsAccountDeletionOpen(true)}
          />

          {/* GDPR Cookie Consent Banner */}
          <CookieConsentBanner />

        </div>
      )}
    </TuxiProvider>
  );

  if (canMountGoogleMaps) {
    return (
      <APIProvider apiKey={apiKey}>
        {appContent}
      </APIProvider>
    );
  }

  return appContent;
}
