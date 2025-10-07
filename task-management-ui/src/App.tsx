import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { router } from './router';

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;
