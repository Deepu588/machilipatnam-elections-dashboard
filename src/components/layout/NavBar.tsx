import { Container, Nav, Navbar } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/parliament', label: 'Lok Sabha results' },
  { to: '/assembly', label: 'Assembly explorer' },
  { to: '/trends', label: 'Trends & indicators' },
];

export default function NavBar() {
  return (
    <Navbar expand="md" className="app-nav" sticky="top" variant="dark" collapseOnSelect>
      <Container>
        <Navbar.Brand as={NavLink} to="/">Machilipatnam </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" aria-label="Toggle navigation" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto" as="nav" aria-label="Dashboard sections">
            {LINKS.map((l) => (
              <Nav.Link key={l.to} as={NavLink} to={l.to} end={l.end} eventKey={l.to}>{l.label}</Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
