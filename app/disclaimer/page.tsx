import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'

export const metadata = genPageMetadata({
  title: 'Disclaimer & Affiliate Disclosure',
  description:
    'Locitra Disclaimer & Affiliate Disclosure — complete transparency regarding affiliate referral relationships, advertising, AI-assisted publishing, editorial independence, product recommendation methodology, and reader responsibilities.',
  canonicalPath: '/disclaimer',
})

const RECOMMENDATION_FACTORS = [
  {
    title: 'Practical Usefulness',
    description:
      'Real-world problem-solving capability and practical relevance to digital builders.',
  },
  {
    title: 'Features & Reliability',
    description:
      'Performance, feature completeness, platform stability, and user interface quality.',
  },
  {
    title: 'Usability & Learning Curve',
    description: 'Accessibility for beginners alongside depth for experienced professionals.',
  },
  {
    title: 'Value & Pricing',
    description:
      'Transparent pricing, free tier availability, refund policies, and cost-to-benefit ratio.',
  },
  {
    title: 'Vendor Reputation',
    description: 'Data security standards, privacy commitment, vendor history, and customer trust.',
  },
  {
    title: 'Documentation & Support',
    description:
      'Quality of official developer guides, help resources, and support responsiveness.',
  },
]

const TRUST_PAGES = [
  {
    title: 'About Locitra',
    href: '/about',
    description: 'Learn about our founding story, audience mission, and core publishing values.',
  },
  {
    title: 'Author Profile',
    href: '/author/sunil-kumar-uikey',
    description: 'Review the professional background and article archives of Sunil Kumar Uikey.',
  },
  {
    title: 'Editorial Policy',
    href: '/editorial-policy',
    description:
      'Our research standards, fact-checking methodology, sources policy, and AI guidelines.',
  },
  {
    title: 'Privacy Policy',
    href: '/privacy-policy',
    description: 'Learn how reader data, cookies, analytics, and privacy rights are protected.',
  },
  {
    title: 'Terms & Conditions',
    href: '/terms',
    description: 'Terms governing website access, content usage, and intellectual property.',
  },
  {
    title: 'Contact Page',
    href: '/contact',
    description:
      'Direct communication channels for reader inquiries, feedback, and error reporting.',
  },
]

export default function DisclaimerPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Page Header */}
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Disclaimer &amp; Affiliate Disclosure
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Publishing Transparency &amp; Legal Disclosures &bull; Last reviewed: July 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-12">
        {/* Introduction */}
        <p className="lead">
          Locitra is committed to maintaining absolute transparency in digital publishing. This
          Disclaimer &amp; Affiliate Disclosure page outlines how we operate, how we handle
          affiliate relationships and advertising, how artificial intelligence assists our content
          workflows, our strict adherence to editorial independence, and the scope and limitations
          of the information published across our magazine.
        </p>

        {/* 1. General Content Disclaimer */}
        <section aria-labelledby="general-heading">
          <h2 id="general-heading">1. General Content Disclaimer</h2>
          <p>
            The information published on Locitra (locitra.com) is provided in good faith for general
            informational and educational purposes only. Our objective is to publish practical,
            accurate, and high-value guidance on technology, artificial intelligence tools, online
            business strategies, productivity, and digital career growth.
          </p>
          <p>
            While we make every reasonable effort to ensure content accuracy and freshness at the
            time of publication, Locitra makes no representations or warranties of any kind, express
            or implied, regarding the completeness, timeliness, accuracy, reliability, or
            suitability of the information contained on this website.
          </p>
          <p>
            Technology tools, software platforms, and market conditions evolve rapidly. Readers are
            encouraged to independently verify critical information, pricing tiers, and vendor
            documentation before making financial, professional, or operational decisions.
          </p>
        </section>

        <hr />

        {/* 2. Affiliate Referral Disclosure */}
        <section aria-labelledby="affiliate-heading">
          <h2 id="affiliate-heading">2. Affiliate Referral Disclosure</h2>
          <p>
            In compliance with Federal Trade Commission (FTC) guidelines and international consumer
            transparency standards, please be aware that Locitra contains affiliate links. This
            means that if you click on a referral link and subsequently purchase a product or
            register for a service, Locitra may receive a referral commission at no additional cost
            to you.
          </p>
          <p>
            We maintain strict standards regarding affiliate referral links to preserve reader
            trust:
          </p>
          <ul>
            <li>
              <strong>No Impact on Pricing:</strong> Clicking an affiliate link never increases the
              price you pay. In some cases, our referral links may grant access to exclusive
              discounts or extended trial periods.
            </li>
            <li>
              <strong>Editorial Over Revenue:</strong> Affiliate referral opportunities never
              dictate our editorial opinion, tool ratings, or pros and cons evaluations.
            </li>
            <li>
              <strong>Independent Rankings:</strong> Affiliate partnerships never guarantee top
              placement, positive scores, or inclusion in our buyer guides.
            </li>
            <li>
              <strong>Selective Recommendations:</strong> We only feature tools, platforms, and
              services that we believe provide genuine utility to our audience.
            </li>
          </ul>
        </section>

        <hr />

        {/* 3. Editorial Independence */}
        <section aria-labelledby="independence-heading">
          <h2 id="independence-heading">3. Editorial Independence &amp; Commercial Policy</h2>
          <p>
            Locitra operates with complete editorial independence. Our editorial staff and research
            workflows remain strictly separated from commercial monetization operations.
          </p>
          <p>Our commercial commitment guarantees that:</p>
          <ul>
            <li>
              <strong>Advertisers Cannot Buy Endorsements:</strong> Software vendors, agencies, and
              service providers cannot purchase positive reviews, favorable ratings, or top
              placement in our roundups.
            </li>
            <li>
              <strong>Unbiased Critiques:</strong> If a tool or service has technical drawbacks,
              limitations, or high pricing, our reviews will highlight those drawbacks regardless of
              affiliate status.
            </li>
            <li>
              <strong>Objective Verdicts:</strong> Commercial relationships never influence our
              final article recommendations, comparison outcomes, or editorial verdicts.
            </li>
          </ul>
          <p>
            To understand how our research and review standards function in detail, please consult
            our full{' '}
            <Link
              href="/editorial-policy"
              className="text-primary-600 dark:text-primary-400 underline"
            >
              Editorial Policy
            </Link>
            .
          </p>
        </section>

        <hr />

        {/* 4. Product Recommendation Philosophy */}
        <section aria-labelledby="philosophy-heading">
          <h2 id="philosophy-heading">4. Product Recommendation Philosophy</h2>
          <p>
            When recommending software platforms, AI tools, or digital services, Locitra evaluates
            products based on objective criteria tailored to reader value:
          </p>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RECOMMENDATION_FACTORS.map((factor) => (
              <div
                key={factor.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {factor.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
          <p>
            <strong>Evaluation Methodology:</strong> We do not claim that every software product
            featured has undergone months of isolated lab testing. Instead, our evaluations combine
            practical hands-on testing where feasible, in-depth review of official vendor
            documentation and changelogs, synthesis of user feedback across technical communities,
            and comparative feature analysis against market alternatives.
          </p>
        </section>

        <hr />

        {/* 5. Advertising Disclosure */}
        <section aria-labelledby="advertising-heading">
          <h2 id="advertising-heading">5. Advertising &amp; Programmatic Disclosure</h2>
          <p>
            To keep our educational content freely accessible without paywalls, Locitra displays
            advertisements. These may include visual banner ads, sponsored modules, or programmatic
            ad networks such as Google AdSense.
          </p>
          <p>Regarding advertising, Locitra adheres to the following principles:</p>
          <ul>
            <li>
              <strong>Clear Differentiation:</strong> Advertisements are clearly distinguished from
              editorial content through labeling, border styling, or distinct placement.
            </li>
            <li>
              <strong>No Editorial Control:</strong> Advertisers and advertising networks have zero
              input into our topic selection, research findings, writing process, or editorial
              stance.
            </li>
            <li>
              <strong>Ad Network Independence:</strong> Programmatic advertisements served by
              networks like Google AdSense are automated based on user context and reader privacy
              settings. Locitra does not endorse specific products displayed within automated ad
              units.
            </li>
          </ul>
        </section>

        <hr />

        {/* 6. AI-Assisted Publishing Disclosure */}
        <section aria-labelledby="ai-heading">
          <h2 id="ai-heading">6. AI-Assisted Publishing Disclosure</h2>
          <p>
            Locitra leverages state-of-the-art artificial intelligence tools as productivity aids
            within our publication workflow. We maintain complete transparency regarding how AI is
            used:
          </p>
          <ul>
            <li>
              <strong>Workflow Assistance:</strong> AI tools assist our team with initial research
              synthesis, structural outlining, topic brainstorming, grammar optimization, and meta
              description generation.
            </li>
            <li>
              <strong>Mandatory Human Oversight:</strong> AI tools never write or publish content
              autonomously. 100% of published articles are reviewed, fact-checked, edited, and
              approved by a human editor.
            </li>
            <li>
              <strong>Verification Against Hallucinations:</strong> Technical claims, code snippets,
              pricing figures, and statistics generated or structured by AI tools are verified
              against primary sources prior to publication.
            </li>
            <li>
              <strong>Human Responsibility:</strong> Our editorial team remains fully accountable
              for the accuracy, quality, and integrity of every published sentence.
            </li>
          </ul>
          <p>
            Learn more about our AI governance rules in our{' '}
            <Link
              href="/editorial-policy"
              className="text-primary-600 dark:text-primary-400 underline"
            >
              Editorial Policy
            </Link>
            .
          </p>
        </section>

        <hr />

        {/* 7. Technology & AI Rapid Evolution Disclaimer */}
        <section aria-labelledby="evolution-heading">
          <h2 id="evolution-heading">7. Technology &amp; AI Rapid Evolution Disclaimer</h2>
          <p>
            The software industry and artificial intelligence sector evolve at an extraordinary
            pace. Product features, user interface layouts, pricing models, free plan quotas, API
            rate limits, and terms of service can change overnight.
          </p>
          <p>
            While Locitra conducts routine content maintenance to keep guides up to date,
            information may become outdated between maintenance cycles.
          </p>
          <p>
            <strong>Reader Action Required:</strong> Readers should always verify current pricing,
            plan limitations, feature availability, and official terms directly on the software
            provider&apos;s official website before making purchasing or software deployment
            decisions.
          </p>
        </section>

        <hr />

        {/* 8. External Links Disclaimer */}
        <section aria-labelledby="links-heading">
          <h2 id="links-heading">8. External Links &amp; Third-Party Content Disclaimer</h2>
          <p>
            Locitra contains links to external, third-party websites, developer documentation,
            vendor portals, and reference publications for reader convenience and source
            attribution.
          </p>
          <ul>
            <li>
              <strong>No Endorsement Implied:</strong> The inclusion of an external link does not
              constitute an endorsement, approval, or warranty of the third-party website, its
              operators, or its content.
            </li>
            <li>
              <strong>Third-Party Autonomy:</strong> Locitra has no control over the nature,
              availability, security, or accuracy of content published on third-party websites.
            </li>
            <li>
              <strong>Independent Policies:</strong> External websites operate under their own terms
              of service, privacy practices, and cookie policies. We encourage readers to review
              third-party policies when leaving Locitra.
            </li>
          </ul>
        </section>

        <hr />

        {/* 9. Earnings & Financial Results Disclaimer */}
        <section aria-labelledby="earnings-heading">
          <h2 id="earnings-heading">9. Earnings &amp; Financial Results Disclaimer</h2>
          <p>
            Articles covering online income strategies, freelancing, digital products, affiliate
            marketing, or side businesses on Locitra are intended solely for educational and
            motivational purposes.
          </p>
          <ul>
            <li>
              <strong>Illustrative Examples Only:</strong> Any revenue figures, earnings statistics,
              traffic counts, or income growth examples mentioned on Locitra represent illustrative
              possibilities, not typical or guaranteed outcomes.
            </li>
            <li>
              <strong>No Income Guarantees:</strong> Locitra makes no guarantee or promise that
              applying strategies, tools, or ideas published here will generate income, sales, or
              business growth.
            </li>
            <li>
              <strong>Variable Individual Factors:</strong> Financial success depends on numerous
              factors outside our control, including individual skill level, work ethic, market
              demand, timing, capital investment, and execution.
            </li>
          </ul>
          <p>
            We advise all readers to perform thorough personal due diligence and evaluate commercial
            opportunities cautiously without relying on unrealistic revenue expectations.
          </p>
        </section>

        <hr />

        {/* 10. No Professional Advice Disclaimer */}
        <section aria-labelledby="advice-heading">
          <h2 id="advice-heading">10. No Professional Advice Disclaimer</h2>
          <p>
            The content published on Locitra is designed strictly for general educational,
            technical, and informational purposes. Nothing on this website constitutes, or should be
            construed as:
          </p>
          <ul>
            <li>Legal advice or formal legal consultation</li>
            <li>Financial, investment, tax, or accounting advice</li>
            <li>Certified career or employment counseling</li>
            <li>Medical or health-related advice</li>
          </ul>
          <p>
            Locitra is a technology publication, not a licensed advisory firm. Always consult a
            qualified, certified professional (such as an attorney, certified financial advisor, or
            CPA) before making significant legal, financial, tax, or career decisions.
          </p>
        </section>

        <hr />

        {/* 11. User Responsibility & Due Diligence */}
        <section aria-labelledby="responsibility-heading">
          <h2 id="responsibility-heading">11. User Responsibility &amp; Due Diligence</h2>
          <p>
            As a reader of Locitra, you assume full responsibility for your actions, decisions, and
            implementation of any recommendations or technical guides published on our site.
          </p>
          <p>We encourage every reader to exercise due diligence by:</p>
          <ul>
            <li>Cross-referencing technical tutorials with official software documentation.</li>
            <li>
              Reviewing vendor pricing tiers, subscription terms, and auto-renewal policies before
              purchasing.
            </li>
            <li>
              Testing tools in sandbox or free-tier environments prior to production deployment.
            </li>
            <li>
              Making independent decisions based on your individual budget, goals, and technical
              requirements.
            </li>
          </ul>
        </section>

        <hr />

        {/* 12. Learn More About Locitra (Trust Ecosystem) */}
        <section aria-labelledby="ecosystem-heading">
          <h2 id="ecosystem-heading">12. Learn More About Locitra</h2>
          <p>
            We invite our readers to explore our complete suite of transparency and publication
            governance pages:
          </p>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_PAGES.map((page) => (
              <div
                key={page.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  <Link href={page.href} className="hover:underline">
                    {page.title}
                  </Link>
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {page.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* 13. Policy Maintenance & Updates */}
        <section aria-labelledby="maintenance-heading">
          <h2 id="maintenance-heading">13. Policy Maintenance &amp; Updates</h2>
          <p>
            Digital publishing regulations, affiliate program terms, advertising standards (such as
            Google AdSense guidelines), and technology environments change over time.
          </p>
          <p>
            Locitra periodically reviews and updates this Disclaimer &amp; Affiliate Disclosure to
            maintain full compliance, reader transparency, and publication integrity. When updates
            occur, the &quot;Last reviewed&quot; date at the top of this page will be updated
            accordingly.
          </p>
          <p>
            For questions, clarifications, or feedback regarding this disclosure, please contact our
            editorial team at{' '}
            <a
              href="mailto:contact@locitra.com?subject=Disclosure%20Inquiry"
              aria-label="Email Locitra Disclosure Inquiry"
              className="hover:underline"
            >
              contact@locitra.com
            </a>
            .
          </p>
        </section>

        <hr />

        {/* 14. Our Commitment to Transparency */}
        <section aria-labelledby="commitment-heading">
          <h2 id="commitment-heading">14. Our Commitment to Transparency</h2>
          <p>
            At Locitra, building long-term reader trust is far more important to us than short-term
            financial gains. We are committed to:
          </p>
          <ul>
            <li>Honest, objective recommendations based on genuine reader value.</li>
            <li>Uncompromising separation between commercial funding and editorial decisions.</li>
            <li>
              Clear, upfront disclosures regarding affiliate links, advertising, and AI tools.
            </li>
            <li>Responsible publishing standards and continuous verification of our content.</li>
            <li>
              Treating our readers with respect and empowering them to make informed digital
              choices.
            </li>
          </ul>
          <p>Thank you for reading Locitra and trusting us as your digital resource.</p>
        </section>
      </div>
    </div>
  )
}
