/** @type {import("pliny/config").PlinyConfig } */

const siteMetadata = {
  title: 'Locitra',
  author: 'Sunil Kumar',
  headerTitle: 'Locitra',
  description:
    'Locitra is a modern blog covering AI tools, technology, online income opportunities, career growth, and success stories.',
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
