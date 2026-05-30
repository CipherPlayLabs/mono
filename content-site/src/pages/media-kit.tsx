import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {MediaAssetGrid} from '@site/src/components/MediaAssetGrid';
import {brandColors} from '@site/src/data/site';
import styles from './media-kit.module.css';

export default function MediaKit(): ReactNode {
  return (
    <Layout title="Media Kit" description="CipherPlay approved public brand assets.">
      <main>
        <CipherHero
          eyebrow="Media kit"
          title="CipherPlay brand assets"
          summary="Download approved public logo, banner, and display font assets from the CipherPlay media kit."
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Brand colors</p>
              <h2>Colors from the provided CipherPlay media kit.</h2>
            </div>
            <div className={styles.colorGrid}>
              {brandColors.map((color) => (
                <article className={styles.color} key={color.value}>
                  <div className={styles.swatch} style={{background: color.value}} />
                  <div>
                    <strong>{color.name}</strong>
                    <span>{color.value}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.header}>
              <p>Downloads</p>
              <h2>Approved logos, banners, font, and packaged assets.</h2>
            </div>
            <MediaAssetGrid />
          </div>
        </section>
      </main>
    </Layout>
  );
}
