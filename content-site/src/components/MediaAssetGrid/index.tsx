import React from 'react';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import {mediaAssets} from '@site/src/data/site';
import styles from './styles.module.css';

export function MediaAssetGrid(): React.JSX.Element {
  const {withBaseUrl} = useBaseUrlUtils();

  return (
    <div className={styles.grid}>
      {mediaAssets.map((asset) => (
        <article className={styles.asset} key={asset.downloadHref}>
          <div className={styles.preview}>
            <img src={withBaseUrl(asset.previewSrc)} alt="" />
          </div>
          <div className={styles.body}>
            <span>{asset.kind}</span>
            <h3>{asset.title}</h3>
            <a
              href={withBaseUrl(asset.downloadHref)}
              download
              onClick={() =>
                window.plausible?.('media_kit_download', {
                  props: {asset: asset.title, format: asset.format},
                })
              }>
              Download {asset.format}
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
