import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router'
import AppLayout from './components/common/AppLayout'

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </BrowserRouter>
  )
}
