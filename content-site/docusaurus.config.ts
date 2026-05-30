import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { links } from './links';

const isProduction = process.env.NODE_ENV === 'production';
const siteUrl = process.env.SITE_URL || 'https://cipherplay.local';
const plausibleSiteDomain = process.env.PLAUSIBLE_SITE_DOMAIN || new URL(siteUrl).hostname;

const config: Config = {
  title: 'CipherPlay',

  favicon: 'img/cipherplay/logo-gradient.svg',

  url: siteUrl,
  baseUrl: '/info/',

  projectName: 'mono',
  organizationName: 'CipherPlayLabs',

  trailingSlash: false,

  onBrokenLinks: 'warn',

  future: {
    v4: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  customFields: {},

  headTags: isProduction
    ? [
        {
          tagName: 'script',
          attributes: {},
          innerHTML:
            'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(options){plausible.o=options||{}};plausible.init({endpoint:"/_analytics/api/event"});',
        },
      ]
    : [],

  scripts: isProduction
    ? [
        {
          src: '/_analytics/js/script.js',
          defer: true,
          'data-domain': plausibleSiteDomain,
          'data-api': '/_analytics/api/event',
        },
      ]
    : [],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'none',
          path: 'docs',
          sidebarPath: 'docs/sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'newsroom',
        routeBasePath: '/newsroom',
        path: './newsroom',
        blogTitle: 'CipherPlay Newsroom',
        blogDescription: 'CipherPlay announcements and milestones.',
        authorsMapPath: '../authors.yml',
        feedOptions: {
          type: [],
        },
        onInlineTags: 'warn',
        onInlineAuthors: 'warn',
        onUntruncatedBlogPosts: 'ignore',
      },
    ],
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexDocs: false,
        indexBlog: true,
        indexPages: true,
        blogDir: ['./newsroom'],
        blogRouteBasePath: ['/newsroom'],
      },
    ],
  ],

  themeConfig: {
    image: 'img/cipherplay/social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'CipherPlay',
      logo: {
        alt: 'CipherPlay',
        src: 'img/cipherplay/logo-gradient.svg',
        srcDark: 'img/cipherplay/logo-gradient.svg',
      },
      items: [
        {
          to: '/about',
          label: 'About',
          position: 'left',
        },
        {
          to: '/market-analysis',
          label: 'Market Research',
          position: 'left',
        },
        {
          to: '/products',
          label: 'Products & Services',
          position: 'left',
        },
        {
          to: '/partners',
          label: 'Partners',
          position: 'left',
        },
        {
          to: '/media-kit',
          label: 'Media Kit',
          position: 'left',
        },
        {
          href: links.investorForm,
          label: 'Investor Materials',
          position: 'right',
          className: 'navbar-investor-cta',
        },
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Navigation',
          items: [
            { to: '/about', label: 'About' },
            { to: '/market-analysis', label: 'Market Research' },
            { to: '/products', label: 'Products & Services' },
            { to: '/partners', label: 'Partners' },
            { to: '/media-kit', label: 'Media Kit' },
          ],
        },
        {
          title: 'Company',
          items: [
            { to: '/team', label: 'Team' },
            { to: '/newsroom', label: 'Newsroom' },
            { href: links.investorForm, label: 'Investor Materials' },
          ],
        },
        {
          title: 'Partners',
          items: [
            { to: '/partners', label: 'Partnerships' },
            { href: links.cipherplayLinkedIn, label: 'LinkedIn' },
          ],
        },
        {
          title: 'Resources',
          items: [
            { to: '/market-analysis', label: 'Market Research' },
            { to: '/products', label: 'Products & Services' },
            { to: '/products/randao', label: 'RANDAO' },
            { href: links.randaoWhitepaper, label: 'RANDAO Whitepaper' },
          ],
        },
        {
          title: 'Media Kit',
          items: [
            { to: '/media-kit', label: 'Brand Assets' },
          ],
        },
      ],
      copyright: 'Copyright (c) ' + new Date().getFullYear() + ' CipherPlay.',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
