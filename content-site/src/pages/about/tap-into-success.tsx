import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {links} from '../../../links';
import styles from '../about.module.css';

const tapCta = {
  label: 'Tap into CipherPlay',
  href: links.investorForm,
  eventName: 'cta_tap_into_cipherplay',
  disabled: false,
};

export default function TapIntoSuccess(): ReactNode {
  return (
    <Layout
      title="Tap into success"
      description="CipherPlay values: Transparency, Authenticity, and Perspicacity as a company-wide value system.">
      <main>
        <CipherHero
          eyebrow="CipherPlay values"
          title="Tap into success."
          summary="At CipherPlay, TAP is how we play the game: Transparency, Authenticity, and Perspicacity."
          cta={tapCta}
        />

        <section className={styles.articleShell}>
          <div className="container">
            <div className={styles.articleLayout}>
              <article className={styles.articleBody}>
                <section className={styles.articleBlock}>
                  <h2>Game theory is the frame.</h2>
                  <p>
                    We believe business is a non-zero-sum, repeated, incomplete-information,
                    asymmetric, multiplayer game. CipherPlay values are our strategy in that game,
                    and the result we aim to build is trust.
                  </p>
                  <p>
                    Because the game is non-zero-sum, we look for work that creates mutual upside
                    with investors, partners, and customers. Because it is repeated and multiplayer,
                    we invest in relationships and networks that compound over time. Because it is
                    asymmetric, we believe the largest opportunities come from teams and partners
                    with varied resources, vantage points, and strengths.
                  </p>
                  <p>
                    The game is incomplete-information, but it is not information scarce. There is
                    an abundance of market, product, customer, and technical signal available. We
                    can move toward a more complete information game by gathering that signal,
                    analyzing it, and sharing the useful parts with the people building alongside
                    us.
                  </p>
                </section>

                <section className={styles.articleBlock}>
                  <h2>TAP is the strategy.</h2>
                  <h3>Transparency</h3>
                  <p>
                    You can count on CipherPlay to be transparent about the markets we research and
                    the products we build. We want investors, partners, and customers to move
                    closer to a perfect information game with us, with enough information to understand
                    what we see, what we are building, and why it matters.
                  </p>

                  <h3>Authenticity</h3>
                  <p>
                    You can count on our words to be reinforced by our actions. Our products should
                    do what we say they do, and our market views should match what we observe. People
                    on our team and around our company should feel confident that the moves we make
                    will match the moves we describe.
                  </p>

                  <h3>Perspicacity</h3>
                  <p>
                    You can count on CipherPlay to turn abundant market information into clear,
                    actionable market insight. Perspicacity is our edge: the ability to see through
                    noisy markets, synthesize what matters, and use artificial intelligence and
                    disciplined research to identify strong next moves.
                  </p>
                </section>

                <section className={styles.articleBlock}>
                  <h2>Trust is the investor signal.</h2>
                  <p>
                    Values matter most when they are repeatable. For investors, TAP is a signal that
                    CipherPlay is building a company whose research, product decisions, and
                    ecosystem relationships can be evaluated with clarity.
                  </p>
                  <ul>
                    <li>
                      <strong>Transparency</strong> makes the company easier to diligence.
                    </li>
                    <li>
                      <strong>Authenticity</strong> makes our claims easier to verify over time.
                    </li>
                    <li>
                      <strong>Perspicacity</strong> makes us a sharper ally in emerging markets
                      where information is abundant but insight is rare.
                    </li>
                  </ul>
                </section>
              </article>

              <aside className={styles.ctaPanel}>
                <h2>Tap into CipherPlay</h2>
                <p>
                  Start with investor materials, or route into partnership and market research
                  requests when that is the better fit.
                </p>
                <ConversionButton cta={tapCta} />
                <div className={styles.ctaLinks}>
                  <TrackedLink
                    to={links.partnerForm}
                    eventName="cta_tap_secondary"
                    eventProps={{destination: 'partnership'}}>
                    Propose a partnership
                  </TrackedLink>
                  <TrackedLink
                    to={links.reportRequestForm}
                    eventName="cta_tap_secondary"
                    eventProps={{destination: 'report-request'}}>
                    Request a full report
                  </TrackedLink>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
