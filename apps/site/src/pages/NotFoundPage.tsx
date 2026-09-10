import { Link } from '@tanstack/react-router';
import { Container, Eyebrow, Heading } from '@kka/site-ui';
export function NotFoundPage(){return <section className="not-found"><Container><Eyebrow>404</Eyebrow><Heading as="h1">THIS PAGE HAS LEFT THE COURTROOM.</Heading><p>The page you requested could not be found.</p><Link className="ui-button ui-button-gold" to="/"><span>Return Home</span><span>→</span></Link></Container></section>}
