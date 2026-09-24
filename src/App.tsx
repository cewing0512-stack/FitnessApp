import { useEffect } from 'react';
import { Outlet, RouterProvider, ScrollRestoration, createBrowserRouter, useMatch } from 'react-router';
import { TabBar } from './components/TabBar';
import { ComingSoon } from './screens/ComingSoon';
import { Complete } from './screens/Complete';
import { History } from './screens/History';
import { Library } from './screens/Library';
import { Player } from './screens/Player';
import { Settings } from './screens/Settings';
import { WorkoutDetail } from './screens/WorkoutDetail';
import { useApp } from './state/store';

function Root() {
  const hydrate = useApp((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // The tab bar only shows on the top-level screens.
  const onWorkout = useMatch('/workout/*');
  return (
    <>
      <Outlet />
      {!onWorkout && <TabBar />}
      <ScrollRestoration />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <Library /> },
      { path: '/workout/:id', element: <WorkoutDetail /> },
      { path: '/workout/:id/play', element: <Player /> },
      { path: '/workout/:id/done', element: <Complete /> },
      { path: '/history', element: <History /> },
      { path: '/settings', element: <Settings /> },
      { path: '*', element: <ComingSoon title="Not found" back="/" /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
