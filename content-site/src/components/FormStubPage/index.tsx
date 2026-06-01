import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import styles from './styles.module.css';

export function FormStubPage({
  title,
  summary,
  formHref,
}: {
  title: string;
  summary: string;
  formHref: string;
}): ReactNode {
  return (
    <Layout title={title} description={summary}>
      <main>
        <CipherHero eyebrow="Request form" title={title} summary={summary} />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.panel}>
              <p>
                Public request flows are hosted on CipherPlay's form surface. Continue
                there when you are ready to submit the details for this request.
              </p>
              <div className={styles.actions}>
                <Link href={formHref} className={styles.primaryAction}>
                  Continue to the hosted form
                </Link>
                <Link to="/about">Return to About</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
