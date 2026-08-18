/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import CameraScreen from './components/CameraScreen';
import DoneScreen from './components/DoneScreen';
import GalleryScreen from './components/GalleryScreen';
import { I18nProvider } from './i18n';

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <PageTransition>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/camera" element={<CameraScreen />} />
            <Route path="/gallery" element={<GalleryScreen />} />
            <Route path="/done" element={<DoneScreen />} />
          </Routes>
        </PageTransition>
      </HashRouter>
    </I18nProvider>
  );
}
