import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-terra-50 px-4 py-16 text-terra-900 dark:bg-[#020504] dark:text-terra-50">
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-[32px] border-terra-200 bg-white p-10 text-center shadow-card dark:border-neutral-700 dark:bg-[#091311]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-terra-500">404</p>
            <h1 className="text-4xl font-semibold text-terra-900 dark:text-terra-50">Page not found</h1>
            <p className="text-terra-600 dark:text-terra-300">The page you were looking for does not exist or may have been moved.</p>
            <Button>
              <Link to="/dashboard">Return to dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default NotFoundPage
