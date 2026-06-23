import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface RouteConfig {
  path: string;
  component: LazyExoticComponent<ComponentType>;
  layout: 'authenticated' | 'fullscreen';
}

const HomePage = lazy(() => import('@/features/landing/landing.component'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const SampleListPage = lazy(() => import('@/features/sample/SampleListPage'));
const SampleEditPage = lazy(() => import('@/features/sample/SampleEditPage'));
const SetupPage = lazy(() => import('@/features/setup/setup.component'));
const OtbPlansListPage = lazy(() => import('@/features/otb/plans-list/plans-list.component'));
const OtbDashboardPage = lazy(() => import('@/features/otb/dashboard/dashboard.component'));
const OtbAnnualPage = lazy(() => import('@/features/otb/annual/annual.component'));
const OtbReleasePage = lazy(() => import('@/features/otb/release/release.component'));
const ValuePlansListPage = lazy(() => import('@/features/value/plans-list/plans-list.component'));
const ValueDashboardPage = lazy(() => import('@/features/value/dashboard/value-dashboard.component'));
const ValueEditorPage = lazy(() => import('@/features/value/editor/value-editor.component'));
const ValueAllPlansPage = lazy(() => import('@/features/value/all-plans/all-plans.component'));
const HistoryPage = lazy(() => import('@/features/history/history.component'));

export const routes: RouteConfig[] = [
  { path: '/home', component: HomePage, layout: 'authenticated' },
  { path: '/user-profile', component: ProfilePage, layout: 'authenticated' },
  { path: '/settings', component: SettingsPage, layout: 'authenticated' },
  { path: '/sample', component: SampleListPage, layout: 'authenticated' },
  { path: '/sample/:mode/:uuid?', component: SampleEditPage, layout: 'authenticated' },
  { path: '/setup', component: SetupPage, layout: 'authenticated' },
  { path: '/otb', component: OtbPlansListPage, layout: 'authenticated' },
  { path: '/otb/annual', component: OtbAnnualPage, layout: 'authenticated' },
  { path: '/otb/:planId', component: OtbDashboardPage, layout: 'authenticated' },
  { path: '/otb/:planId/annual', component: OtbAnnualPage, layout: 'authenticated' },
  { path: '/otb/:planId/release/:periodKey', component: OtbReleasePage, layout: 'authenticated' },
  { path: '/value', component: ValuePlansListPage, layout: 'authenticated' },
  { path: '/value/all', component: ValueAllPlansPage, layout: 'authenticated' },
  { path: '/value/:planId', component: ValueDashboardPage, layout: 'authenticated' },
  { path: '/value/:planId/:otbCode', component: ValueEditorPage, layout: 'authenticated' },
  { path: '/history', component: HistoryPage, layout: 'authenticated' },
];
