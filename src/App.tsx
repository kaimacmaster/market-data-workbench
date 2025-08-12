import { QueryProvider } from './app/QueryProvider';
import { AppRouter } from './app/Router';

function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  );
}

export default App;