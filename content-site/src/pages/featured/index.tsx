import React, {useMemo} from 'react';
import {FeaturedCard} from '@site/src/components/FeaturedCard';
import {FeaturedItems} from '@site/src/data/featured';
import type {FeaturedItem} from '@site/src/data/featured';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import styles from './styles.module.css';

function sortItems(items: FeaturedItem[]): FeaturedItem[] {
  return [...items].sort((a, b) => {
    const aFav = a.tags.includes('favorite');
    const bFav = b.tags.includes('favorite');
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export default function FeaturedPage(): React.JSX.Element {
  const sorted = useMemo(() => sortItems(FeaturedItems), []);

  return (
    <Layout title="Featured Media" description="Public media and talks relevant to CipherPlay product work.">
      <Head>
        <meta property="og:title" content="Featured Media" />
        <meta property="og:description" content="Public media and talks relevant to CipherPlay product work." />
      </Head>

      <div className="container padding--lg">
        <div className={styles.page}>
          <header className={styles.header}>
            <h1 className={styles.title}>Featured Media</h1>
            <p className={styles.subtitle}>
              Public interviews, talks, and discussions retained as product and research context for CipherPlay.
            </p>
          </header>

          <div className={styles.grid}>
            {sorted.map((item) => (
              <FeaturedCard key={`${item.title}-${item.date}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
