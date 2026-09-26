import AgentDemo from './AgentDemo';
import Build from './Build';
import Observe from './Observe';
import Developers from './Developers';

const capabilities = [
  { title: 'Skills', text: 'Versioned capabilities that define what your agent knows how to do.' },
  { title: 'Tools', text: 'Connect real actions such as search, quotes, CRM operations, and APIs.' },
  { title: 'Memory', text: 'Keep useful conversational and customer context across interactions.' },
  { title: 'Policies', text: 'Control what an agent is allowed to execute before tools run.' },
  { title: 'Multimodal', text: 'Work with text, audio, images, video, and documents.' },
  { title: 'Execution', text: 'Trace every agent run from intent to action and response.' },
];

const developerItems = [
  ['API', 'Send and receive WhatsApp messages through one API.'],
  ['Webhooks', 'Receive reliable event delivery from your conversations.'],
  ['SDK', 'Build integrations directly into your application.'],
  ['n8n', 'Coming in the developer platform.'],
  ['MCP', 'Coming in the developer platform.'],
  ['Embeds', 'Coming in the developer platform.'],
];

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 lg:px-10">
        <a href="/" className="text-2xl font-bold tracking-tight text-white">
          <img
  src="/images/relt-logo.png"
  alt="Relt Logo"
  width={150}
  height={32}
 
  className="h-13 w-auto"  
/>
        </a>

        <nav className="hidden items-center gap-15 text-sm text-slate-20 md:flex">
          <a href="#product" className="transition hover:text-white">Product</a>
          <a href="#agents" className="transition hover:text-white">Agents</a>
          <a href="#developers" className="transition hover:text-white">Developers</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
          <a href="/login" className="transition hover:text-white">Login</a>
        </nav>

        <a
          href="/register"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Start free
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_10%,rgba(37,99,235,0.18),transparent_37%)]" />

      <div className="relative mx-auto max-w-[1520px] px-6 pb-24 pt-20 lg:px-10 lg:pb-28 lg:pt-28">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(380px,0.75fr)_minmax(0,1.7fr)] lg:gap-12 xl:gap-16">
          <div>
            <div className="mb-7 inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              AI agents · WhatsApp · Production
            </div>

          
<h1 className="text-4xl font-semibold leading-[1.04] tracking-[-0.03em] text-white sm:text-5xl lg:text-[52px] xl:text-[60px]">
  Build <span className="text-blue-500">AI agents</span> that actually do the work on{' '}
<span className="text-blue-500">WhatsApp.</span>

</h1>



            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              RELT helps you build, deploy and monitor AI agents that handle real conversations, automate business processes and run in production — all through WhatsApp.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/register"
                className="rounded-lg bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
              >
                Start free
              </a>

              <a
                href="#demo"
                className="rounded-lg border border-white/15 px-7 py-3.5 font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
              >
                See it in action
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
              <span>Sandbox available</span>
              <span>Meta production ready</span>
              <span>Provider-agnostic agents</span>
            </div>
          </div>

          <div id="demo">
<div id="agent-demo" className="scroll-mt-24"><AgentDemo /></div>
          </div>
        </div>
      </div>
    </section>
  );
}








 function Connect() {
  return (
    <section
      id="product"
      className="border-t border-white/10 py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        
        {/* --- NUEVO CONTENEDOR FLEX PARA ALINEAR TEXTO E IMAGEN --- */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-start gap-8 lg:gap-15">
          
          {/* Textos (Izquierda) */}
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
              Connect
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
              
             Build in sandbox. Run the same <span className="text-blue-500">Agent </span>in <span className="text-blue-500">Production. </span> {' '}













            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Test your agents quickly, then connect real business numbers
              through Meta when you are ready.
            </p>
          </div>

          {/* Imagen (Derecha) - Se agregó el </div> que faltaba */}
          <div className="flex justify-center shrink-0 mt-8 lg:mt-0">
            <img
              src="/images/logo_celN.png"
              alt="Relt Logo"
              width={350}
              height={350}
              className="w-full max-w-[300px] lg:max-w-[400px] h-auto object-contain"
            />
          </div>


          <div className="flex justify-center shrink-0 mt-8 lg:mt-0">
            <img
              src="/images/meta.png"
              alt="Relt Logo"
              width={350}
              height={350}
              className="w-full max-w-[300px] lg:max-w-[400px] h-auto object-contain"
            />
          </div>


        </div>






        {/* Same Agent bridge */}
        <div className="relative mt-12 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />

          <div className="relative z-10 flex items-center gap-2 rounded-full border border-blue-400/20 bg-[#020817] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400/40 animate-ping motion-reduce:animate-none" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
            </span>

            Same Agent · Different Provider
          </div>

          <div className="h-px flex-1 bg-white/10" />

          {/* Traveling light */}
          <div
            className="
              pointer-events-none
              absolute left-0 top-1/2
              h-px w-full
              -translate-y-1/2
              overflow-hidden
              motion-reduce:hidden
            "
            aria-hidden="true"
          >
            <span
              className="
                connect-travel
                absolute
                top-1/2
                h-1
                w-16
                rounded-full
                bg-blue-400/80
                blur-sm
              "
            />
          </div>
        </div>

        {/* Environment cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Sandbox */}
          <article
            className="
              group rounded-2xl
              border border-blue-400/20
              bg-blue-400/[0.035]
              p-8
              transition-all duration-300
              hover:-translate-y-1
              hover:border-blue-400/40
              hover:bg-blue-400/[0.055]
              hover:shadow-[0_18px_60px_rgba(37,99,235,0.10)]
              motion-reduce:transform-none
              motion-reduce:transition-none
            "
          >
            {/* Card header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-300">
                SANDBOX
              </span>

              <span
                className="
                  rounded-full
                  border border-blue-400/20
                  bg-blue-400/[0.06]
                  px-3 py-1
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-wide
                  text-blue-300
                "
              >
                Start here
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-4 text-2xl font-semibold text-white">
              Relt API
            </h3>

            {/* Description */}
            <p className="mt-3 max-w-xl leading-7 text-slate-400">
              Test your Agent, conversations, tools and runtime behavior
              without touching production.
            </p>

            {/* CTA */}
            <div className="mt-6">
              <a
                href="/sandbox"
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-blue-300
                  transition-colors
                  duration-200
                  hover:text-blue-200
                "
              >
                Start in sandbox
                <span
                  aria-hidden="true"
                  className="
                    transition-transform
                    duration-200
                    group-hover:translate-x-1
                  "
                >
                  →
                </span>
              </a>
            </div>

            {/* Technical evidence */}
            <div
              className="
                mt-6
                rounded-xl
                border border-white/10
                bg-slate-950/70
                p-4
                font-mono
                text-xs
                leading-6
              "
            >
              <div>
                <span className="text-slate-600">agent</span>{" "}
                ={" "}
                <span className="text-blue-300">
                  sales-assistant@1.1.1
                </span>
              </div>

              <div>
                <span className="text-slate-600">provider</span>{" "}
                = RELT
              </div>

              <div>
                <span className="text-slate-600">mode</span>{" "}
                = sandbox
              </div>

              <div>
                <span className="text-slate-600">status</span>{" "}
                ={" "}
                <span className="text-emerald-400">
                  connected
                </span>
              </div>
            </div>
          </article>

          {/* Production */}
          <article
            className="
              group rounded-2xl
              border border-emerald-400/15
              bg-slate-900/65
              p-8
              transition-all duration-300
              hover:-translate-y-1
              hover:border-emerald-400/30
              hover:bg-emerald-400/[0.025]
              hover:shadow-[0_18px_60px_rgba(16,185,129,0.08)]
              motion-reduce:transform-none
              motion-reduce:transition-none
            "
          >
            {/* Card header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-300">
                PRODUCTION
              </span>

              <span
                className="
                  rounded-full
                  border border-emerald-400/15
                  bg-emerald-400/[0.04]
                  px-3 py-1
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-wide
                  text-emerald-300
                "
              >
                Go live
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-4 text-2xl font-semibold text-white">
              Meta Cloud API
            </h3>

            {/* Description */}
            <p className="mt-3 max-w-xl leading-7 text-slate-400">
              Connect real WhatsApp business numbers without rebuilding
              your Agent or changing its runtime.
            </p>

            {/* CTA */}
            <div className="mt-6">
              <a
                href="/register"
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-emerald-300
                  transition-colors
                  duration-200
                  hover:text-emerald-200
                "
              >
                Connect Meta
                <span
                  aria-hidden="true"
                  className="
                    transition-transform
                    duration-200
                    group-hover:translate-x-1
                  "
                >
                  →
                </span>
              </a>
            </div>

            {/* Technical evidence */}
            <div
              className="
                mt-6
                rounded-xl
                border border-white/10
                bg-black/20
                p-4
                font-mono
                text-xs
                leading-6
              "
            >
              <div>
                <span className="text-slate-600">agent</span>{" "}
                ={" "}
                <span className="text-blue-300">
                  sales-assistant@1.1.1
                </span>
              </div>

              <div>
                <span className="text-slate-600">provider</span>{" "}
                = META
              </div>

              <div>
                <span className="text-slate-600">mode</span>{" "}
                = production
              </div>

              <div>
                <span className="text-slate-600">status</span>{" "}
                ={" "}
                <span className="text-emerald-400">
                  authenticated
                </span>
              </div>
            </div>
          </article>
        </div>

        {/* Closing statement */}
        <div className="mt-8 flex flex-col items-center text-center">
          <p className="text-base font-medium text-slate-300">
            One Agent. Two environments.{" "}
            <span className="text-white">No rebuild.</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span>Same Skills</span>

            <span className="text-slate-700">•</span>

            <span>Same Tools</span>

            <span className="text-slate-700">•</span>

            <span>Same Runtime</span>

            <span className="text-slate-700">•</span>

            <span className="text-blue-300">
              Different Provider
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}





function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-white/10 py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
            Pricing
          </p>

          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
            Build your <span className="text-blue-500">Agent.</span>{' '}
            Test it <span className="text-blue-500">Free.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Create, test, and refine your AI Agent in the RELT sandbox for 10 days.
          </p>
        </div>

        {/* Main pricing area */}
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Developer Trial */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-400/30 bg-slate-950/70 p-8 text-left shadow-[0_0_80px_rgba(37,99,235,0.08)] sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                  DEVELOPER TRIAL
                </p>

                <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300">
                  10 DAYS FREE
                </span>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-white">
                  $0
                </span>
                <span className="pb-1 text-sm text-slate-500">
                  for 10 days
                </span>
              </div>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                Everything you need to create, test, and refine an AI Agent
                before taking it to production.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  'Agent Runtime',
                  'Skills & Tools',
                  'Memory',
                  'Multimodal agents',
                  'WhatsApp sandbox',
                  'Execution tracing',
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-slate-300"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs text-emerald-300">
                      ✓
                    </span>

                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 border-t border-white/10 pt-5">
                <p className="text-sm leading-6 text-slate-500">
                  No billing during the trial. No credit card required.
                </p>
              </div>

              <a
                href="/register"
                className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
              >
                Start free
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* Production */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-left sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              PRODUCTION
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Ready for a real WhatsApp number?
            </h3>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              Keep the Agent you built in the sandbox and take it to
              production with Meta when you are ready.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Keep the same Agent',
                'Connect a real WhatsApp number',
                'Production infrastructure',
                'Usage-based plans as RELT evolves',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 text-sm text-slate-300"
                >
                  <span className="mt-0.5 text-blue-400">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Production plans
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Production pricing will evolve as RELT expands.
              </p>
            </div>

            <a
              href="#connect"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition-colors hover:text-blue-200"
            >
              See how it works
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Bottom message */}
        <div className="mx-auto mt-8 max-w-5xl rounded-xl border border-white/10 bg-slate-900/40 px-6 py-5">
          <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
            <span className="text-sm font-medium text-white">
              Build once.
            </span>

            <span className="hidden text-slate-700 sm:inline">•</span>

            <span className="text-sm text-slate-400">
              Test in the sandbox.
            </span>

            <span className="hidden text-slate-700 sm:inline">•</span>

            <span className="text-sm text-slate-400">
              Take your Agent to production.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="start" className="border-t border-white/10 py-28 lg:py-36">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
            Build your agent
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
           
            Build your first <span className="text-blue-500">Agent. </span>Take it to <span className="text-blue-500">Production.</span> {' '}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Start in the sandbox, give your Agent the tools it needs, and move
            to a real WhatsApp number when you are ready.
          </p>

          <div className="mt-10">
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-500"
            >
              Start free
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
            10 days free · Evolution sandbox · Meta production
          </p>
        </div>
      </div>

    </section>
  );
}




export default function LandingV2() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <Nav />
      <Hero />
      <Connect />
      <Build />
      <Observe />
      <Developers />
      <Pricing />
      <FinalCTA />
    </main>
  );
}


     <img
  src="/images/relt-logo.png"
  alt="Relt Logo"
  width={150}
  height={32}
 
  className="h-13 w-auto"  
/>
