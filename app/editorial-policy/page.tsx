import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'

export const metadata = genPageMetadata({
  title: 'Editorial Policy',
  description:
    'Locitra Editorial Policy — our editorial governance, research methodology, sources & citations standards, AI usage disclosure, review criteria, and corrections policy.',
  canonicalPath: '/editorial-policy',
})

const EDITORIAL_PRINCIPLES = [
  {
    title: 'Accuracy',
    description: 'Grounding every claim in research, official sources, and careful verification.',
  },
  {
    title: 'Transparency',
    description: 'Clearly disclosing AI usage, affiliate links, and editorial processes.',
  },
  {
    title: 'Editorial Independence',
    description: 'Ensuring commercial relationships never dictate reviews or recommendations.',
  },
  {
    title: 'Practical Value',
    description: 'Focusing on actionable insights that readers can apply immediately.',
  },
  {
    title: 'Reader-First Publishing',
    description: 'Prioritizing reader clarity, usefulness, and trust above all else.',
  },
  {
    title: 'Continuous Improvement',
    description: 'Regularly updating content as software, AI tools, and industries evolve.',
  },
]

export default function EditorialPolicyPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Page Header */}
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Editorial Policy
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Editorial Governance &amp; Publishing Standards &bull; Last reviewed: July 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-12">
        <p className="lead">
          This Editorial Policy details how Locitra researches, verifies, writes, reviews, and
          maintains trustworthy digital content. Our goal is to provide full transparency into our
          editorial governance so readers understand how our content is created, how decisions are
          made, and why our recommendations can be trusted.
        </p>

        {/* 1. Our Mission */}
        <section aria-labelledby="mission-heading">
          <h2 id="mission-heading">1. Our Mission</h2>
          <p>
            Locitra exists to help readers navigate the fast-changing world of technology,
            artificial intelligence, online income strategies, productivity, and career growth. Our
            mission is to:
          </p>
          <ul>
            <li>Publish practical, actionable, and trustworthy guidance for digital builders.</li>
            <li>Demystify complex technology and machine learning concepts in clear language.</li>
            <li>Maintain total independence from commercial vendors and affiliate partners.</li>
            <li>
              Be fully transparent about how content is produced, including when AI tools assist
              drafting.
            </li>
          </ul>
        </section>

        <hr />

        {/* 2. Our Editorial Principles */}
        <section aria-labelledby="principles-heading">
          <h2 id="principles-heading">2. Our Editorial Principles</h2>
          <p>
            Every piece of content published on Locitra is guided by six foundational editorial
            principles:
          </p>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EDITORIAL_PRINCIPLES.map((principle) => (
              <div
                key={principle.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {principle.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* 3. Research Process */}
        <section aria-labelledby="research-heading">
          <h2 id="research-heading">3. Research Methodology</h2>
          <p>
            Our content creation process is grounded in rigorous investigation. Depending on the
            article scope, research methods may include:
          </p>
          <ul>
            <li>
              <strong>Official Technical Documentation:</strong> Consulting developer guides, API
              references, product release notes, and vendor specifications.
            </li>
            <li>
              <strong>Hands-on Evaluation:</strong> Where practical, exploring software user
              interfaces, features, workflows, and performance.
            </li>
            <li>
              <strong>Reputable Industry Publications:</strong> Synthesizing verified data from
              established technology journalism, benchmark studies, and academic research.
            </li>
            <li>
              <strong>Public Technical Repositories:</strong> Reviewing open-source code
              repositories, release changelogs, and user documentation.
            </li>
          </ul>
          <p>
            Research approaches are tailored to the topic—tool guides prioritize workflow clarity,
            while industry analysis focuses on verified trends and primary source data.
          </p>
          <p>
            Whenever practical and appropriate, we direct readers to official documentation, primary
            sources, or authoritative original references so they can independently verify key
            information and data.
          </p>
        </section>

        <hr />

        {/* 4. Sources & Citations Policy */}
        <section aria-labelledby="citations-heading">
          <h2 id="citations-heading">4. Sources &amp; Citations Policy</h2>
          <p>
            Locitra is committed to source transparency. Whenever practical, we explicitly reference
            or link to primary sources so readers can independently verify information:
          </p>
          <ul>
            <li>
              <strong>Primary Links:</strong> Directing readers to official product websites,
              technical whitepapers, or authoritative original reporting.
            </li>
            <li>
              <strong>Data Attribution:</strong> Attributing statistics, survey data, market
              numbers, and study findings to their original research entities.
            </li>
            <li>
              <strong>Contextual Disclosure:</strong> Clearly distinguishing between established
              factual data, expert analysis, and editorial perspective.
            </li>
          </ul>
        </section>

        <hr />

        {/* 5. Fact-Checking Standards */}
        <section aria-labelledby="fact-checking-heading">
          <h2 id="fact-checking-heading">5. Fact-Checking &amp; Verification</h2>
          <p>Accuracy is central to our editorial integrity. Our verification process includes:</p>
          <ul>
            <li>Verifying technical feature claims against official vendor specifications.</li>
            <li>
              Confirming subscription pricing, free tier availability, and tier limits at time of
              publication.
            </li>
            <li>Cross-checking numerical statistics against original research reports.</li>
            <li>
              Reviewing AI-assisted drafts to eliminate hallucinations, factual drift, or outdated
              details.
            </li>
          </ul>
          <p>
            In rapidly changing sectors like artificial intelligence, information can evolve
            quickly. We maintain an active content lifecycle to review and update articles as
            details change.
          </p>
        </section>

        <hr />

        {/* 6. Editorial Independence */}
        <section aria-labelledby="independence-heading">
          <h2 id="independence-heading">6. Editorial Independence &amp; Commercial Policy</h2>
          <p>
            Locitra maintains complete editorial independence across all published content. To
            support our independent publishing operations, Locitra participates in affiliate
            marketing programs and displays advertisements.
          </p>
          <p>Our commercial policy strictly enforces the following boundaries:</p>
          <ul>
            <li>
              <strong>No Paid Reviews:</strong> Software vendors cannot pay for positive reviews,
              top-tier rankings, or favorable editorial coverage.
            </li>
            <li>
              <strong>Independence from Commissions:</strong> Affiliate referral fees never
              influence product evaluation scores, pros/cons lists, or editorial recommendations.
            </li>
            <li>
              <strong>Clear Labelling:</strong> Where affiliate links exist, they are clearly
              disclosed upfront in accordance with FTC guidelines.
            </li>
          </ul>
          <p>
            For full financial transparency, view our{' '}
            <Link href="/disclaimer" className="text-primary-600 dark:text-primary-400 underline">
              Disclaimer &amp; Affiliate Disclosure
            </Link>
            .
          </p>
        </section>

        <hr />

        {/* 7. AI Usage Policy */}
        <section aria-labelledby="ai-policy-heading">
          <h2 id="ai-policy-heading">7. AI Usage &amp; Drafting Policy</h2>
          <p>
            Locitra utilizes artificial intelligence tools as part of its content workflow. We
            believe in total transparency regarding AI technology:
          </p>
          <h3>How AI tools may assist:</h3>
          <ul>
            <li>Drafting initial structural outlines or first-pass summaries.</li>
            <li>Brainstorming section headings, topic ideas, or phrasing variations.</li>
            <li>Generating or optimizing meta descriptions and SEO copy.</li>
          </ul>
          <h3>What AI tools never do:</h3>
          <ul>
            <li>
              AI tools do not make editorial decisions, select topics, or approve publications.
            </li>
            <li>
              AI tools never bypass human review—100% of published content is edited, verified, and
              approved by a human editor.
            </li>
            <li>
              AI tools are never used to fabricate data, generate false claims, or bypass research
              standards.
            </li>
          </ul>
        </section>

        <hr />

        {/* 8. Product Review Methodology */}
        <section aria-labelledby="methodology-heading">
          <h2 id="methodology-heading">8. Software &amp; Product Evaluation Criteria</h2>
          <p>
            When evaluating software platforms, AI tools, or digital products, Locitra applies
            objective criteria tailored to practical user value:
          </p>
          <ul>
            <li>
              <strong>Core Features &amp; Performance:</strong> Assessing real-world capabilities,
              speed, reliability, and user interface design.
            </li>
            <li>
              <strong>Usability &amp; Learning Curve:</strong> Evaluating how accessible the tool is
              for beginners versus experienced professionals.
            </li>
            <li>
              <strong>Pricing &amp; Value:</strong> Analyzing pricing tiers, free plans, refund
              policies, and overall cost-to-benefit ratio.
            </li>
            <li>
              <strong>Privacy &amp; Security:</strong> Reviewing data privacy standards, encryption
              practices, and vendor reputation.
            </li>
            <li>
              <strong>Documentation &amp; Support:</strong> Checking the quality of official
              documentation, customer support responsiveness, and community resources.
            </li>
          </ul>
        </section>

        <hr />

        {/* 9. Content Maintenance */}
        <section aria-labelledby="maintenance-heading">
          <h2 id="maintenance-heading">9. Content Maintenance &amp; Revision Lifecycle</h2>
          <p>
            Technology articles require ongoing maintenance to remain accurate. Locitra
            systematically monitors published articles to reflect software updates, pricing changes,
            and new features:
          </p>
          <ul>
            <li>
              <strong>Periodic Reviews:</strong> Published guides are regularly re-evaluated against
              current software versions.
            </li>
            <li>
              <strong>Significant Revisions:</strong> Articles undergoing major structural or
              factual updates include timestamped notes or updated publication dates.
            </li>
            <li>
              <strong>Retirements:</strong> Obsolete guides or discontinued software articles may be
              redirected or archived to maintain catalog quality.
            </li>
          </ul>
        </section>

        <hr />

        {/* 10. Corrections Policy */}
        <section aria-labelledby="corrections-heading">
          <h2 id="corrections-heading">10. Corrections Policy</h2>
          <p>
            We are committed to prompt, transparent error resolution. If you identify a factual
            inaccuracy, outdated pricing, or broken link:
          </p>
          <ul>
            <li>
              <strong>Minor Corrections:</strong> Typographical, grammatical, or formatting fixes
              are corrected directly.
            </li>
            <li>
              <strong>Factual Revisions:</strong> Factual updates are made promptly, with correction
              notes added where clarity requires explanation of what changed.
            </li>
            <li>
              <strong>Reporting Errors:</strong> Readers are encouraged to report errors to{' '}
              <a
                href="mailto:contact@locitra.com?subject=Correction%20Request"
                aria-label="Email Locitra Correction Request"
                className="hover:underline"
              >
                contact@locitra.com
              </a>{' '}
              with the subject line &quot;Correction Request&quot;.
            </li>
          </ul>
        </section>

        <hr />

        {/* 11. What Readers Can Expect */}
        <section aria-labelledby="expect-heading">
          <h2 id="expect-heading">11. What Readers Can Expect</h2>
          <p>When reading Locitra, readers can consistently expect:</p>
          <ul>
            <li>Evidence-based, practical guidance without theoretical filler.</li>
            <li>Objective software evaluations highlighting both advantages and limitations.</li>
            <li>Full transparency regarding AI usage and financial monetization.</li>
            <li>Clear, accessible language designed for human understanding.</li>
            <li>Continuous content maintenance as technology evolves.</li>
          </ul>
        </section>

        <hr />

        {/* 12. Learn More About Locitra */}
        <section aria-labelledby="trust-ecosystem-heading">
          <h2 id="trust-ecosystem-heading">12. Learn More About Locitra</h2>
          <p>
            We invite readers to review our complete suite of publication policies and trust pages:
          </p>
          <ul>
            <li>
              <Link href="/about" className="hover:underline">
                About Locitra
              </Link>{' '}
              — Learn about our founding story, audience mission, and core values.
            </li>
            <li>
              <Link href="/author/sunil-kumar-uikey" className="hover:underline">
                Author &amp; Editor Profile
              </Link>{' '}
              — Review the background, research focus, and article archives of Sunil Kumar Uikey.
            </li>
            <li>
              <Link href="/disclaimer" className="hover:underline">
                Disclaimer &amp; Affiliate Disclosure
              </Link>{' '}
              — Detailed disclosure regarding affiliate referral commissions and advertising.
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>{' '}
              — Learn how reader data, analytics, and privacy are protected.
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms &amp; Conditions
              </Link>{' '}
              — Terms governing website access and content usage.
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact Page
              </Link>{' '}
              — Direct message forms and editorial inquiry contacts.
            </li>
          </ul>
        </section>

        <hr />

        {/* 13. Our Editorial Commitment */}
        <section aria-labelledby="commitment-heading">
          <h2 id="commitment-heading">13. Our Editorial Commitment</h2>
          <p>
            Locitra is dedicated to maintaining high editorial governance standards, publishing
            trustworthy and practical technology content, and continuously earning reader confidence
            with every article we release.
          </p>
          <p>
            This Editorial Policy is reviewed periodically to reflect evolving technology, best
            publishing practices, and reader feedback. Thank you for relying on Locitra as your
            trusted digital resource.
          </p>
        </section>
      </div>
    </div>
  )
}
