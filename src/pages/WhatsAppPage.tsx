import { Card } from '../components/ui/Card'
import { useTranslation } from '../hooks/useTranslation'

export function WhatsAppPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <Card title="WhatsApp support">
        <p className="text-terra-600">Open a chat to connect your farm intelligence with support, market leads, and advisors.</p>
      </Card>

      <Card className="rounded-[32px] bg-terra-50 p-8 text-center">
        <p className="text-lg font-semibold text-terra-900">Ready to talk with your farm advisor?</p>
        <p className="mt-3 text-terra-600">Use WhatsApp to get weather alerts, crop tips, and market timing advice.</p>
        <a
          href="https://wa.me/919000000000"
          className="mt-6 inline-flex rounded-2xl bg-terra-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-terra-600"
        >
          Start WhatsApp chat
        </a>
      </Card>
    </div>
  )
}
