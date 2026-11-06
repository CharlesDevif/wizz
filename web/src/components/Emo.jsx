import React from 'react';
import { renderEmoticons } from '../lib/emoticons.js';
/* Texte avec émoticônes (HTML généré par le même moteur que l'ancienne version) */
export default function Emo({ text, custom, as: Tag = 'span', className, style, ...rest }) {
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: renderEmoticons(text == null ? '' : text, custom) }} {...rest} />;
}
export const Dp = ({ dp, className = '' }) => <div className={'dp ' + className}>{dp ? <img src={dp} alt="" /> : <svg><use href="#av-default" /></svg>}</div>;
