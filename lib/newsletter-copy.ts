export type NewsletterVariant = 'article' | 'homepage' | 'category' | 'footer'

export interface NewsletterCopy {
  heading: string
  description: string
  ctaText: string
}

export const newsletterCopyConfig: Record<NewsletterVariant, NewsletterCopy> = {
  article: {
    heading: 'Enjoyed this article?',
    description:
      'Get practical AI tools, technology insights, software reviews, career growth advice, and online income strategies delivered to your inbox.',
    ctaText: 'Subscribe Free',
  },
  homepage: {
    heading: 'Stay Ahead in AI, Technology & Digital Growth',
    description:
      'Get practical AI tools, technology insights, software reviews, career growth advice, and online income strategies delivered to your inbox.',
    ctaText: 'Subscribe',
  },
  category: {
    heading: 'Stay Ahead in AI, Technology & Digital Growth',
    description:
      'Get practical AI tools, technology insights, software reviews, career growth advice, and online income strategies delivered to your inbox.',
    ctaText: 'Subscribe',
  },
  footer: {
    heading: 'Newsletter',
    description: 'Weekly insights on AI, tech & digital income — free.',
    ctaText: 'Subscribe',
  },
}
