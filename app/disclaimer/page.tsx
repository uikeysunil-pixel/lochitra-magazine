import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({
  title: 'Disclaimer',
  description:
    'Locitra Disclaimer — affiliate disclosure, earnings disclaimer, and general content disclaimer.',
})

export default function DisclaimerPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Disclaimer
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          Last updated: June 1, 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-8">
        <h2>General Disclaimer</h2>
        <p>
          The information provided on Locitra (locitra.com) is for general informational and
          educational purposes only. While we strive to keep content accurate and up to date, we
          make no representations or warranties of any kind, express or implied, about the
          completeness, accuracy, reliability, or suitability of the information.
        </p>
        <p>
          Any reliance you place on the information on this website is strictly at your own risk.
          Locitra shall not be held liable for any loss or damage arising from the use of, or
          reliance on, any information published here.
        </p>

        <h2>Affiliate Disclosure</h2>
        <p>
          In accordance with the FTC guidelines, Locitra may contain affiliate links. This means
          that if you click on a link and make a purchase, we may receive a small commission at no
          additional cost to you.
        </p>
        <p>
          We only recommend products and services that we genuinely believe provide value. Our
          editorial opinions are our own and are never influenced by affiliate relationships.
        </p>

        <h2>Earnings Disclaimer</h2>
        <p>
          Any income or earnings figures mentioned on Locitra are examples only and should not be
          interpreted as typical or guaranteed results. Individual results will always vary and
          depend on many factors including but not limited to individual effort, experience, and
          market conditions.
        </p>
        <p>
          Nothing on this website should be construed as financial or investment advice. Always do
          your own research and consult a qualified professional before making financial decisions.
        </p>

        <h2>External Links</h2>
        <p>
          Locitra may link to external websites for your convenience and information. These links do
          not signify our endorsement of those sites or their content. We have no control over the
          nature, content, and availability of external websites.
        </p>

        <h2>AI-Generated Content</h2>
        <p>
          Some articles on Locitra may be written with the assistance of AI tools. Where AI has been
          used to assist in drafting, structuring, or researching content, it is clearly disclosed
          within the article or in our <a href="/editorial-policy">Editorial Policy</a>.
        </p>
        <p>
          All AI-assisted content undergoes mandatory human review and editing before publication.
          Our editorial team checks AI-generated content for accuracy, clarity, factual correctness,
          and adherence to our content standards. We do not publish unreviewed AI-generated content.
        </p>

        <h2>No Professional Advice</h2>
        <p>
          The content published on Locitra is intended for general informational and educational
          purposes only. Nothing on this website constitutes or should be interpreted as:
        </p>
        <ul>
          <li>Financial or investment advice</li>
          <li>Legal advice</li>
          <li>Tax advice</li>
          <li>Medical or health advice</li>
          <li>Career or employment advice from a certified professional</li>
        </ul>
        <p>
          Always consult a qualified professional before making decisions in any of these areas.
          Locitra is not responsible for decisions made based on content published on this website.
        </p>

        <h2>Accuracy Disclaimer</h2>
        <p>
          We make every effort to ensure that the information on Locitra is accurate, current, and
          useful at the time of publication. However, information — especially in fast-moving fields
          like technology and AI — can become outdated quickly.
        </p>
        <p>
          We provide all information in good faith but make no warranties or representations of any
          kind, express or implied, as to the completeness, accuracy, or fitness for a particular
          purpose of any content on this site.
        </p>

        <h2>User Responsibility</h2>
        <p>
          Readers are responsible for independently verifying any information found on Locitra
          before acting upon it. We encourage you to:
        </p>
        <ul>
          <li>Cross-reference information with authoritative or official sources.</li>
          <li>Consult qualified professionals where appropriate.</li>
          <li>
            Use your own judgment when evaluating tools, products, or strategies covered here.
          </li>
        </ul>

        <h2>Contact</h2>
        <p>
          For questions about this disclaimer, please contact us at{' '}
          <a
            href="mailto:contact@locitra.com?subject=Inquiry%20from%20Locitra"
            aria-label="Email Locitra"
            className="hover:underline"
          >
            contact@locitra.com
          </a>
          .
        </p>
      </div>
    </div>
  )
}
