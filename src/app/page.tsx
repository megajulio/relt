export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            WhatsApp infrastructure
            <br />
            <span className="text-blue-400">for developers building with AI</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12">
            Send messages, receive webhooks, run AI agents, and scale your WhatsApp infrastructure with one API.
          </p>

          {/* Code Block */}
          <div className="bg-gray-900 rounded-lg p-6 mb-12 text-left border border-gray-800 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <pre className="text-sm md:text-base text-gray-100 overflow-x-auto">
              <code>{`import { Relt } from "@relt/sdk";

const relt = new Relt({
  apiKey: process.env.RELT_API_KEY
});

await relt.messages.send({
  to: "+573001234567",
  text: "Hello from Relt 🚀"
});`}</code>
            </pre>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <a
              href="#get-api-key"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              Get API Key →
            </a>
            <a
              href="#quickstart"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-lg border border-gray-700"
            >
              View Quickstart
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Messaging</h3>
            <p className="text-gray-300">
              Send and receive WhatsApp messages through one reliable API.
            </p>
          </div>

          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Agents</h3>
            <p className="text-gray-300">
              Build AI agents with portable, versioned and permissioned skills.
            </p>
          </div>

          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Infrastructure</h3>
            <p className="text-gray-300">
              Multi-provider routing, queues, observability and reliability built in.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Developer Preview</h2>
          
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
            <div className="text-5xl font-bold text-white mb-4">
              $25<span className="text-xl text-gray-400">/month</span>
            </div>
            
            <ul className="text-gray-300 mb-8 space-y-3">
              <li>✓ Messaging API</li>
              <li>✓ Webhooks</li>
              <li>✓ SDK</li>
              <li>✓ Agent Skills</li>
              <li>✓ Multi-provider support</li>
            </ul>

            <a
              href="#get-api-key"
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Get API Key
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
