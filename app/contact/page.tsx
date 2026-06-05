import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({
  title: 'Contact',
  description:
    'Get in touch with the Locitra team. We welcome questions, feedback, and collaboration proposals.',
})

export default function ContactPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Contact
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          Have a question or want to collaborate? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-8">
        <p>
          Locitra is a digital magazine covering AI tools, technology trends, online income
          strategies, career growth, and success stories. Whether you have feedback, a story pitch,
          or a partnership idea — reach out.
        </p>

        <h2>Email Us</h2>
        <p>
          The fastest way to reach us is by email:{' '}
          <a href="mailto:contact@locitra.com">contact@locitra.com</a>
        </p>
        <p>We aim to respond within 2–3 business days.</p>

        <h2>Topics We Cover</h2>
        <ul>
          <li>AI Tools &amp; Reviews</li>
          <li>Technology News &amp; Insights</li>
          <li>Online Income Strategies</li>
          <li>Career Growth &amp; Productivity</li>
          <li>Success Stories from Digital Creators</li>
        </ul>

        <h2>Collaborations &amp; Guest Posts</h2>
        <p>
          Interested in contributing an article, proposing a sponsored post, or exploring a
          partnership? Include your proposal details in your email and we&apos;ll review it
          promptly.
        </p>

        <h2>General Inquiries</h2>
        <p>
          For corrections, suggestions, or any other questions about Locitra, please don&apos;t
          hesitate to reach out at <a href="mailto:contact@locitra.com">contact@locitra.com</a>.
        </p>
      </div>
    </div>
  )
}
