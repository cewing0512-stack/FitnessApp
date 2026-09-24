import { useEffect } from 'react';
import { Outlet, RouterProvider, ScrollRestoration, createBrowserRouter, useMatch } from 'react-router';
import { TabBar } from './components/TabBar';
import { ComingSoon } from './screens/ComingSoon';
import { Library } from './screens/Library';
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
      { path: '/workout/:id/play', element: <ComingSoon title="Player" phase={3} back="/" /> },
      { path: '/history', element: <ComingSoon title="History" phase={3} /> },
      { path: '/settings', element: <ComingSoon title="Settings" phase={3} /> },
      { path: '*', element: <ComingSoon title="Not found" back="/" /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
