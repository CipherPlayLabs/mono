import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { links } from './links';

const isProduction = process.env.NODE_ENV === 'production';

const config: Config = {
  title: 'CipherPlay',

  favicon: 'img/cipherplay/logo-gradient.svg',

  url: 'https://allanbpediniv.com',
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
          'data-domain': 'allanbpediniv.com',
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
        blog: {
          id: 'default',
          routeBasePath: '/insights',
          path: './insights',
          blogTitle: 'Archived Insights',
          blogDescription: 'Archived builder notes and supporting context.',
          showReadingTime: true,
          authorsMapPath: '../authors.yml',
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'Archived Insights',
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'ignore',
        },
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
        id: 'research',
        routeBasePath: '/research',
        path: './research',
        blogTitle: 'Archived Research',
        blogDescription: 'Archived research material retained for product and market context.',
        showReadingTime: true,
        blogSidebarTitle: 'All research',
        blogSidebarCount: 'ALL',
        authorsMapPath: '../authors.yml',
        feedOptions: {
          type: ['rss', 'atom'],
          title: 'Archived Research',
        },
        onInlineTags: 'warn',
        onInlineAuthors: 'warn',
        onUntruncatedBlogPosts: 'ignore',
      },
    ],
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
          type: ['rss', 'atom'],
          title: 'CipherPlay Newsroom',
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
        indexBlog: true,
        indexPages: true,
        blogDir: ['./research', './insights', './newsroom'],
        blogRouteBasePath: ['/research', '/insights', '/newsroom'],
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
            { to: '/industries', label: 'Industries' },
            { to: '/newsroom', label: 'Newsroom' },
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
            {
              href: 'https://allanbpediniv.com/info/media-kit/cipherplay-media-kit.zip',
              label: 'Download ZIP',
            },
          ],
        },
        {
          title: 'RSS Feeds',
          items: [
            { href: 'https://allanbpediniv.com/info/newsroom/rss.xml', label: 'Newsroom' },
            {
              href: 'https://allanbpediniv.com/info/research/rss.xml',
              label: 'Archived Research',
            },
            {
              href: 'https://allanbpediniv.com/info/insights/rss.xml',
              label: 'Archived Insights',
            },
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
