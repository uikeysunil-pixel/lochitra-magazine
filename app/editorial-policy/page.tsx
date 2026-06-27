import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({
  title: 'Editorial Policy',
  description:
    'Locitra Editorial Policy — our content standards, research process, AI usage disclosure, fact-checking approach, and corrections policy.',
  canonicalPath: '/editorial-policy',
})

export default function EditorialPolicyPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Editorial Policy
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          Last updated: June 5, 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-8">
        <p>
          This Editorial Policy explains how Locitra selects, researches, writes, reviews, and
          publishes content. Our commitment is to produce content that is accurate, useful, honest,
          and genuinely helpful to our readers.
        </p>

        {/* 1. Mission */}
        <h2>1. Our Mission</h2>
        <p>
          Locitra exists to help readers navigate the fast-changing world of technology, artificial
          intelligence, digital income, and career development. Our mission is to:
        </p>
        <ul>
          <li>Publish practical, actionable, and trustworthy content.</li>
          <li>Simplify complex topics for everyday readers.</li>
          <li>
            Cover AI tools, technology trends, online income, career growth, and success stories.
          </li>
          <li>Be transparent about how content is created, including when AI tools are used.</li>
        </ul>

        {/* 2. Content Standards */}
        <h2>2. Content Standards</h2>
        <p>Every article published on Locitra is expected to meet the following standards:</p>
        <ul>
          <li>
            <strong>Accuracy:</strong> Claims are based on research, verified sources, or direct
            experience. We do not knowingly publish false or misleading information.
          </li>
          <li>
            <strong>Relevance:</strong> Content must be relevant and useful to our target audience —
            people interested in AI, technology, digital income, and career growth.
          </li>
          <li>
            <strong>Clarity:</strong> Articles are written in plain language, avoiding unnecessary
            jargon. Complex concepts are explained clearly.
          </li>
          <li>
            <strong>Fairness:</strong> Where multiple perspectives exist, we aim to represent them
            fairly. We do not take partisan political positions.
          </li>
          <li>
            <strong>Independence:</strong> Editorial decisions are not influenced by advertisers,
            affiliate relationships, or sponsored content arrangements.
          </li>
        </ul>

        {/* 3. Research Process */}
        <h2>3. Research Process</h2>
        <p>Our content creation process typically follows these steps:</p>
        <ol>
          <li>
            <strong>Topic selection:</strong> Topics are chosen based on reader relevance, search
            demand, and the genuine usefulness of the information.
          </li>
          <li>
            <strong>Research:</strong> We consult authoritative sources, official documentation,
            reputable publications, and real-world testing where applicable.
          </li>
          <li>
            <strong>Drafting:</strong> Content is drafted with a focus on clarity, structure, and
            usefulness. AI tools may assist in this stage (see AI Usage Policy below).
          </li>
          <li>
            <strong>Review:</strong> All drafts are reviewed by an editor or the founder before
            publication.
          </li>
          <li>
            <strong>Publication:</strong> Content is published with appropriate metadata, category
            tagging, and SEO optimisation.
          </li>
        </ol>

        {/* 4. Fact Checking */}
        <h2>4. Fact-Checking</h2>
        <p>We take accuracy seriously. Our fact-checking approach includes:</p>
        <ul>
          <li>
            Verifying statistics and data points against their original or authoritative sources
            before inclusion.
          </li>
          <li>
            Linking to primary sources, official documentation, or reputable publications where
            available.
          </li>
          <li>
            Avoiding speculation presented as fact — where information is uncertain, we say so
            clearly.
          </li>
          <li>Reviewing AI-assisted content carefully for factual accuracy before publication.</li>
        </ul>
        <p>
          While we strive for accuracy, information — particularly in fast-moving fields like AI and
          technology — can become outdated. If you spot an error, please notify us (see Corrections
          Policy below).
        </p>

        {/* 5. AI Usage Policy */}
        <h2>5. AI Usage Policy</h2>
        <p>
          Locitra uses AI tools as part of its content workflow. We believe in transparent
          disclosure of AI usage. Here is exactly how AI is and is not used at Locitra:
        </p>
        <h3>How AI may assist content creation:</h3>
        <ul>
          <li>Drafting initial outlines or first drafts of articles.</li>
          <li>Suggesting structure, headings, or phrasing.</li>
          <li>Summarising research or identifying key points.</li>
          <li>Generating or improving meta descriptions and SEO copy.</li>
        </ul>
        <h3>What AI does not do:</h3>
        <ul>
          <li>
            AI does not make editorial decisions — topic selection, publication decisions, and
            editorial standards are set by human editors.
          </li>
          <li>
            AI does not bypass the review process — every piece of AI-assisted content is reviewed
            and edited by a human before publication.
          </li>
          <li>AI is not used to generate false, misleading, or fabricated information.</li>
        </ul>
        <h3>Our commitment:</h3>
        <p>
          Where AI has materially assisted in drafting an article, we endeavour to disclose this
          within the article or in associated metadata. We are committed to continuously improving
          our AI usage policies as the technology and best practices evolve.
        </p>

        {/* 6. Affiliate Disclosure */}
        <h2>6. Affiliate and Sponsored Content Disclosure</h2>
        <p>
          Some articles on Locitra may contain affiliate links. This means that if you click a link
          and make a purchase, we may receive a small commission at no additional cost to you.
        </p>
        <p>
          Affiliate relationships do <strong>not</strong> influence our editorial opinions or
          recommendations. We only recommend products and services we genuinely believe provide
          value to readers. All affiliate relationships are disclosed in accordance with FTC
          guidelines.
        </p>
        <p>
          Locitra does not currently publish sponsored posts. If this changes in the future, any
          sponsored content will be clearly labelled as such.
        </p>

        {/* 7. Corrections Policy */}
        <h2>7. Corrections Policy</h2>
        <p>
          We are committed to correcting errors promptly and transparently. If an error is
          identified in a published article:
        </p>
        <ul>
          <li>
            <strong>Minor errors</strong> (typos, formatting issues) are corrected silently.
          </li>
          <li>
            <strong>Factual errors</strong> are corrected with a correction note added to the
            article indicating what was changed and when.
          </li>
          <li>
            <strong>Significant errors</strong> that affect the meaning or accuracy of an article
            may result in the article being substantially revised or, in rare cases, unpublished.
          </li>
        </ul>
        <p>
          To report an error, please contact us at{' '}
          <a
            href="mailto:contact@locitra.com?subject=Inquiry%20from%20Locitra"
            aria-label="Email Locitra"
            className="hover:underline"
          >
            contact@locitra.com
          </a>{' '}
          with the subject line &quot;Correction Request&quot; and a description of the issue.
        </p>

        {/* 8. Contact */}
        <h2>8. Contact Information</h2>
        <p>
          For questions about our editorial standards, content, or to report an error, please
          contact:
        </p>
        <p>
          <strong>Sunil Kumar Uikey</strong> — Founder &amp; Editor, Locitra
          <br />
          Email:{' '}
          <a
            href="mailto:contact@locitra.com?subject=Inquiry%20from%20Locitra"
            aria-label="Email Locitra"
            className="hover:underline"
          >
            contact@locitra.com
          </a>
          <br />
          Website: <a href="https://locitra.com">locitra.com</a>
        </p>
      </div>
    </div>
  )
}
