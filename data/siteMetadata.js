/** @type {import("pliny/config").PlinyConfig } */

const siteMetadata = {
  title: 'Lochitra',
  author: 'Sunil Kumar',
  headerTitle: 'Lochitra',
  description: 'AI, Technology, Online Income & Success Stories',
  language: 'en-us',
  theme: 'system',
  siteUrl: 'https://lochitra.com',
  siteRepo: 'https://github.com/lochitra',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/logo.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,

  email: 'contact@lochitra.com',
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
