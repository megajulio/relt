'use client';

import { CodeBlock } from '@/components/code-block';
import Link from 'next/link';
import { useT } from '@/i18n/provider';

export default function QuickstartPage() {
  const t = useT();
  return (
    <div className="max-w-3xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t("quickstart.quickstart")}</h1>
        <p className="text-gray-400 mt-2">
          {t("quickstart.send-your-first-whatsapp-message-in-under-5-minutes")}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          {t("quickstart.your-progress")}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">✓</div>
            <span className="text-sm text-gray-300">{t("quickstart.create-your-api-key")}</span>
            <Link href="/dashboard/api-keys" className="ml-auto text-xs text-blue-400 hover:text-blue-300">{t("quickstart.manage-keys")}</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center text-xs">○</div>
            <span className="text-sm text-white">{t("quickstart.install-the-sdk")}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center text-xs">○</div>
            <span className="text-sm text-white">{t("quickstart.send-your-first-message")}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center text-xs">○</div>
            <span className="text-sm text-white">{t("quickstart.receive-your-first-webhook")}</span>
          </div>
        </div>
      </div>

      {/* Step 1: Install */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold shrink-0">1</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">{t("quickstart.install-the-sdk")}</h2>
            <p className="text-gray-400 mb-4">
              {t("quickstart.add-the-relt-sdk-to-your-project-with-npm-or-yarn")}
            </p>
            <CodeBlock
              code="npm install @relt/sdk"
              language="bash"
              title={t("quickstart.terminal")}
            />
          </div>
        </div>
      </div>

      {/* Step 2: Configure API Key */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold shrink-0">2</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">{t("quickstart.configure-your-api-key")}</h2>
            <p className="text-gray-400 mb-4">
              {t("quickstart.set-your-api-key-as-an-environment-variable-never-commit")}
            </p>
            <CodeBlock
              code={'export RELT_API_KEY=relt_live_xxxxxxxxx'}
              language="bash"
              title={t("quickstart.terminal")}
            />
            <div className="mt-3">
              <p className="text-sm text-gray-500">{t("quickstart.or-add-it-to-your")} <code className="text-gray-300">{t("quickstart.env")}</code> {t("quickstart.file")}</p>
              <CodeBlock
                code={'RELT_API_KEY=relt_live_xxxxxxxxx'}
                language="env"
                title={t("quickstart.env")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Send first message */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold shrink-0">3</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">{t("quickstart.send-your-first-whatsapp-message")}</h2>
            <p className="text-gray-400 mb-4">
              {t("quickstart.create-a-file-called")} <code className="text-gray-300">{t("quickstart.index-ts")}</code> {t("quickstart.and-add-this-code")}
            </p>
            <CodeBlock
              code={`import { Relt } from '@relt/sdk';

const relt = new Relt({
  apiKey: process.env.RELT_API_KEY!,
});

const message = await relt.messages.send({
  to: '573001234567',
  text: 'Hello from Relt 🚀',
});

console.log(message);`}
              language="typescript"
              title={t("quickstart.index-ts")}
            />
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">{t("quickstart.run-it-with")}</p>
              <CodeBlock
                code="npx tsx index.ts"
                language="bash"
                title={t("quickstart.terminal")}
              />
            </div>
            <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-200">
                <strong>{t("quickstart.expected-output")}</strong>
              </p>
              <pre className="text-xs text-green-300 mt-2 font-mono">
{`{
  data: {
    id: 'msg_xxxxx',
    to: '573001234567',
    status: 'queued',
    createdAt: '2026-...'
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Webhook */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold shrink-0">4</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">{t("quickstart.receive-your-first-webhook")}</h2>
            <p className="text-gray-400 mb-4">
              {t("quickstart.when-someone-replies-to-your-message-relt-sends-a-webhoo")}
            </p>
            <CodeBlock
              code={`import express from 'express';

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log('Event received:', req.body);
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Webhook listening on :3000');
});`}
              language="typescript"
              title={t("quickstart.webhook-ts")}
            />
            <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-200">
                <strong>{t("quickstart.for-local-development")}</strong> {t("quickstart.expose-your-local-server-to-the-internet-using-a-tunneli")}
              </p>
              <CodeBlock
                code="ngrok http 3000"
                language="bash"
                title={t("quickstart.terminal")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">{t("quickstart.next-steps")}</h2>
        <p className="text-gray-300 text-sm">
          {t("quickstart.once-you-ve-sent-your-first-message-explore-the-full-api")}
        </p>
      </div>
    </div>
  );
}
