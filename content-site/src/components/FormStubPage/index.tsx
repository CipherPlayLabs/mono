import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import styles from './styles.module.css';

export function FormStubPage({
  title,
  summary,
}: {
  title: string;
  summary: string;
}): ReactNode {
  return (
    <Layout title={title} description={summary}>
      <main>
        <CipherHero eyebrow="Request form" title={title} summary={summary} />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.panel}>
              <p>
                This route is reserved for the live form integration. The final form can
                replace this page without changing any conversion CTA links.
              </p>
              <Link to="/about">Return to About</Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
