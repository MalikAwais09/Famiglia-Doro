import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { RoleProvider } from '@/context/RoleContext';
import { WalletProvider } from '@/context/WalletContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AgreementProvider } from '@/context/AgreementContext';
import { Layout } from '@/layout/Layout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GeoCompliancePopup } from '@/components/GeoCompliancePopup';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load all pages
const SplashLogo = lazy(() => import('@/pages/onboarding/SplashLogo').then(m => ({ default: m.SplashLogo })));
const OnboardComplete = lazy(() => import('@/pages/onboarding/OnboardComplete').then(m => ({ default: m.OnboardComplete })));
const SignIn = lazy(() => import('@/pages/auth/SignIn').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('@/pages/auth/SignUp').then(m => ({ default: m.SignUp })));
const VerifyCode = lazy(() => import('@/pages/auth/VerifyCode').then(m => ({ default: m.VerifyCode })));
const Success = lazy(() => import('@/pages/auth/Success').then(m => ({ default: m.Success })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Feed = lazy(() => import('@/pages/Feed').then(m => ({ default: m.Feed })));
const Challenges = lazy(() => import('@/pages/challenges/Challenges').then(m => ({ default: m.Challenges })));
const ChallengeDetail = lazy(() => import('@/pages/challenges/ChallengeDetail').then(m => ({ default: m.ChallengeDetail })));
const CreateChallenge = lazy(() => import('@/pages/challenges/CreateChallenge').then(m => ({ default: m.CreateChallenge })));
const ChallengeEnter = lazy(() => import('@/pages/challenges/ChallengeEnter').then(m => ({ default: m.ChallengeEnter })));
const ChallengeSuccess = lazy(() => import('@/pages/challenges/ChallengeSuccess').then(m => ({ default: m.ChallengeSuccess })));
const ChallengeEntrySuccess = lazy(() => import('@/pages/challenges/ChallengeEntrySuccess').then(m => ({ default: m.ChallengeEntrySuccess })));
const ChallengeVoting = lazy(() => import('@/pages/challenges/ChallengeVoting').then(m => ({ default: m.ChallengeVoting })));
const SubmissionSuccess = lazy(() => import('@/pages/challenges/SubmissionSuccess').then(m => ({ default: m.SubmissionSuccess })));
const ChallengeWinners = lazy(() => import('@/pages/challenges/ChallengeWinners').then(m => ({ default: m.ChallengeWinners })));
const ClaimPrize = lazy(() => import('@/pages/challenges/ClaimPrize').then(m => ({ default: m.ClaimPrize })));
const MyEntries = lazy(() => import('@/pages/MyEntries').then(m => ({ default: m.MyEntries })));
const LiveEvents = lazy(() => import('@/pages/LiveEvents').then(m => ({ default: m.LiveEvents })));
const LiveEventWatch = lazy(() => import('@/pages/LiveEventWatch').then(m => ({ default: m.LiveEventWatch })));
const Leaderboards = lazy(() => import('@/pages/Leaderboards').then(m => ({ default: m.Leaderboards })));
const Tournaments = lazy(() => import('@/pages/Tournaments').then(m => ({ default: m.Tournaments })));
const WinnersPage = lazy(() => import('@/pages/winners/WinnersPage').then(m => ({ default: m.WinnersPage })));
const WinnerSpotlight = lazy(() => import('@/pages/winners/WinnerSpotlight').then(m => ({ default: m.WinnerSpotlight })));
const Pricing = lazy(() => import('@/pages/Pricing').then(m => ({ default: m.Pricing })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));
const TermsOfService = lazy(() => import('@/pages/legal/TermsOfService').then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const CommunityGuidelines = lazy(() => import('@/pages/legal/CommunityGuidelines').then(m => ({ default: m.CommunityGuidelines })));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminChallenges = lazy(() => import('@/pages/admin/AdminChallenges').then(m => ({ default: m.AdminChallenges })));
const AdminTransactions = lazy(() => import('@/pages/admin/AdminTransactions').then(m => ({ default: m.AdminTransactions })));
const AdminAgreements = lazy(() => import('@/pages/admin/AdminAgreements').then(m => ({ default: m.AdminAgreements })));
const AdminFraud = lazy(() => import('@/pages/admin/AdminFraud').then(m => ({ default: m.AdminFraud })));

function SuspenseFallback() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <RoleProvider>
            <WalletProvider>
              <NotificationProvider>
              <AgreementProvider>
                <Toaster theme="dark" position="bottom-right" richColors />
                <GeoCompliancePopup />
                <Suspense fallback={<SuspenseFallback />}>
                  <Routes>
                    <Route path="/" element={<SplashLogo />} />
                    <Route path="/onboard" element={<OnboardComplete />} />
                    <Route path="/auth/sign-in" element={<SignIn />} />
                    <Route path="/auth/sign-up" element={<SignUp />} />
                    <Route path="/auth/verify-code" element={<VerifyCode />} />
                    <Route path="/auth/success" element={<Success />} />
                    <Route path="/legal/terms" element={<Suspense fallback={<SuspenseFallback />}><TermsOfService /></Suspense>} />
                    <Route path="/legal/privacy" element={<Suspense fallback={<SuspenseFallback />}><PrivacyPolicy /></Suspense>} />
                    <Route path="/legal/community-guidelines" element={<Suspense fallback={<SuspenseFallback />}><CommunityGuidelines /></Suspense>} />
                    <Route element={<Layout />}>
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                      <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
                      <Route path="/challenges/create" element={<ProtectedRoute><CreateChallenge /></ProtectedRoute>} />
                      <Route path="/challenges/:id" element={<ProtectedRoute><ChallengeDetail /></ProtectedRoute>} />
                      <Route path="/challenges/:id/enter" element={<ProtectedRoute><ChallengeEnter /></ProtectedRoute>} />
                      <Route path="/challenges/:id/success" element={<ProtectedRoute><ChallengeSuccess /></ProtectedRoute>} />
                      <Route path="/challenges/:id/entry-success" element={<ProtectedRoute><ChallengeEntrySuccess /></ProtectedRoute>} />
                      <Route path="/challenges/:id/voting" element={<ProtectedRoute><ChallengeVoting /></ProtectedRoute>} />
                      <Route path="/challenges/:id/submission-success" element={<ProtectedRoute><SubmissionSuccess /></ProtectedRoute>} />
                      <Route path="/challenges/:id/winners" element={<ProtectedRoute><ChallengeWinners /></ProtectedRoute>} />
                      <Route path="/challenges/:id/claim-prize" element={<ProtectedRoute><ClaimPrize /></ProtectedRoute>} />
                      <Route path="/my-entries" element={<ProtectedRoute><MyEntries /></ProtectedRoute>} />
                      <Route path="/live-events" element={<ProtectedRoute><LiveEvents /></ProtectedRoute>} />
                      <Route path="/live-events/:id/watch" element={<ProtectedRoute><LiveEventWatch /></ProtectedRoute>} />
                      <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
                      <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
                      <Route path="/winners" element={<ProtectedRoute><WinnersPage /></ProtectedRoute>} />
                      <Route path="/winners/:challengeId" element={<ProtectedRoute><WinnerSpotlight /></ProtectedRoute>} />
                    <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="challenges" element={<AdminChallenges />} />
                      <Route path="transactions" element={<AdminTransactions />} />
                      <Route path="agreements" element={<AdminAgreements />} />
                      <Route path="fraud" element={<AdminFraud />} />
                    </Route>
                    </Route>
                  </Routes>
                </Suspense>
              </AgreementProvider>
              </NotificationProvider>
            </WalletProvider>
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
