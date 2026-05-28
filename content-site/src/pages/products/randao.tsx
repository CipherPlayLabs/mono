import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {FeaturedItems} from '@site/src/data/featured';
import {products} from '@site/src/data/site';
import {links} from '../../../links';
import styles from './products.module.css';

const randao = products.find((product) => product.slug === 'randao')!;
const randaoMedia = FeaturedItems.filter((item) =>
  `${item.title} ${item.description}`.toLowerCase().includes('randao'),
).slice(0, 3);

export default function Randao(): ReactNode {
  return (
    <Layout title="RANDAO" description={randao.summary}>
      <main>
        <CipherHero
          eyebrow={randao.status}
          title="RANDAO"
          summary={randao.summary}
          cta={randao.cta}
          imageSrc="/img/research/randao-logo.png"
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.randaoLayout}>
              <article className={styles.panel}>
                <p className={styles.eyebrow}>Product thesis</p>
                <h2>Reliable randomness is infrastructure for trust-sensitive software.</h2>
                <p>
                  RANDAO is CipherPlay's public blockchain infrastructure work in applied
                  cryptographic systems. This page points to the live product and whitepaper
                  while keeping deeper customer and commercialization material
                  out of the public site until approved.
                </p>
                <ul>
                  <li>Connects CipherPlay's cryptographic protocol focus to a concrete product.</li>
                  <li>Gives investors and partners a public reference point for randomness and trust infrastructure.</li>
                  <li>Supports partner and customer conversations without publishing private materials.</li>
                </ul>
                <div className={styles.actions}>
                  <TrackedLink
                    to={links.randao}
                    eventName="product_randao_outbound"
                    eventProps={{destination: 'randao-site'}}>
                    Visit RANDAO
                  </TrackedLink>
                  <TrackedLink
                    to={links.randaoWhitepaper}
                    eventName="product_randao_outbound"
                    eventProps={{destination: 'whitepaper'}}>
                    Read whitepaper
                  </TrackedLink>
                  {randao.cta && <ConversionButton cta={randao.cta} />}
                </div>
              </article>
              <aside className={styles.panel}>
                <h2>Featured media</h2>
                <div className={styles.mediaList}>
                  {randaoMedia.map((item) => (
                    <a
                      className={styles.mediaItem}
                      href={item.website}
                      target="_blank"
                      rel="noreferrer"
                      key={item.website}>
                      <img src={item.preview} alt="" />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.outlet}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
