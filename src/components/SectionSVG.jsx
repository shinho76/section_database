import { drawShapeSVG } from '../lib/sectionSvg.js';

export default function SectionSVG({ shape, unit }) {
  const svg = drawShapeSVG(shape, unit);
  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
