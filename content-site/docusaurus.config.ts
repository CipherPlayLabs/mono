import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { links } from './links';

const config: Config = {
  title: 'abpiv',

  favicon: 'img/headshot.png',

  url: 'https://allanbpediniv.com',
  baseUrl: '/info/',

  projectName: 'abpiv-personal-brand',
  organizationName: 'abpiv',

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
          blogTitle: 'Insights',
          blogDescription: 'Posts and ideas -- blog-style.',
          showReadingTime: true,
          authorsMapPath: '../authors.yml',
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'Insights',
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
        blogTitle: 'Research',
        blogDescription: 'Long-form studies and analyses.',
        showReadingTime: true,
        blogSidebarTitle: 'All research',
        blogSidebarCount: 'ALL',
        authorsMapPath: '../authors.yml',
        feedOptions: {
          type: ['rss', 'atom'],
          title: 'Research',
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
        blogTitle: 'Newsroom',
        blogDescription: 'Announcements and milestones.',
        authorsMapPath: '../authors.yml',
        feedOptions: {
          type: ['rss', 'atom'],
          title: 'Newsroom',
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
        blogRouteBasePath: ['/research', '/insights', '/newsroom'],
      },
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'abpiv',
      logo: {
        alt: 'Allan B. Pedin IV',
        src: 'img/headshot.png',
        srcDark: 'img/headshot.png',
      },
      items: [
        {
          to: '/research',
          label: 'Research',
          position: 'left',
        },
        {
          to: '/featured',
          label: 'Featured on',
          position: 'left',
        },
        {
          to: '/insights',
          label: 'Insights',
          position: 'left',
        },
        {
          to: '/newsroom',
          label: 'Newsroom',
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
            { to: '/research', label: 'Research' },
            { to: '/featured', label: 'Featured' },
            { to: '/insights', label: 'Insights' },
            { to: '/newsroom', label: 'Newsroom' },
          ],
        },
        {
          title: 'RSS Feeds',
          items: [
            { to: '/research/rss.xml', label: 'Research' },
            { to: '/insights/rss.xml', label: 'Insights' },
            { to: '/newsroom/rss.xml', label: 'Newsroom' },
          ],
        },
      ],
      copyright: 'Copyright (c) ' + new Date().getFullYear() + ' Allan B. Pedin IV.',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
