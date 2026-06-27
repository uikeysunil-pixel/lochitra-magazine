/** @type {import("pliny/config").PlinyConfig } */

const siteMetadata = {
  title: 'Locitra - AI Tools, Technology & Online Income Blog',
  author: 'Sunil Kumar Uikey',
  headerTitle: 'Locitra',
  description:
    'Explore Locitra for expert guides on AI tools, technology trends, online income strategies, career growth tips, and real success stories from digital creators.',
  shortTitle: 'Locitra',
  language: 'en-us',
  theme: 'system',
  siteUrl: 'https://locitra.com',
  siteRepo: 'https://github.com/locitra',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/logo.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,

  email: 'contact@locitra.com',
  github: '',
  x: '',
  facebook: '',
  youtube: '',
  linkedin: '',
  threads: '',
  instagram: '',
  medium: '',
  bluesky: '',

  locale: 'en-US',
  stickyNav: true,

  analytics: {},

  newsletter: {
    provider: '',
  },

  comments: {
    provider: '',
  },

  search: {
    provider: 'kbar',
    kbarConfig: {
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
}

module.exports = siteMetadata
